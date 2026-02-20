"""Shared report building logic for session Q&A (student and professor)."""

import asyncio
import time

from services import openai_client
from models import (
    AnswerOut,
    AnswerFeedbackOut,
    CitationOut,
    ReportQuestionOut,
    RepeatingQuestionGroup,
    SessionReportResponse,
    TopicGroup,
)

_ANIMALS = [
    "Lion", "Tiger", "Bear", "Wolf", "Eagle", "Dolphin", "Fox", "Owl",
    "Hawk", "Panther", "Jaguar", "Falcon", "Lynx", "Puma", "Raven",
    "Cobra", "Orca", "Cheetah", "Moose", "Bison", "Rhino", "Giraffe",
    "Penguin", "Puffin", "Meerkat", "Capybara", "Octopus", "Narwhal",
    "Platypus", "Axolotl",
]


def _animal_name(student_id: str, sorted_student_ids: list[str]) -> str:
    try:
        idx = sorted_student_ids.index(student_id)
    except ValueError:
        idx = hash(student_id)
    return f"Anonymous {_ANIMALS[idx % len(_ANIMALS)]}"


# Cache: refresh every 10 min or when 10 new questions. Key: session_id.
_REPORT_CACHE: dict[str, dict] = {}
_CACHE_TTL_SEC = 600  # 10 minutes
_CACHE_QUESTION_THRESHOLD = 10


def invalidate_report_cache_for_session(session_id: str) -> None:
    """Clear cached reports for a session (e.g. when professor updates labels)."""
    keys_to_remove = [k for k in _REPORT_CACHE if k.startswith(f"{session_id}:")]
    for k in keys_to_remove:
        del _REPORT_CACHE[k]


async def build_session_report(
    db,
    session_id: str,
    published_only: bool = True,
    include_review_data: bool = False,
) -> SessionReportResponse:
    """Build anonymised Q&A report for a session. Caller must verify access.
    Summary is cached and refreshed every 10 min or when 10 new questions arrive."""
    published_filter = "AND q.published = true" if published_only else ""
    now = time.time()

    # Get current question count for cache decision
    current_count = await db.fetchval(
        f"SELECT COUNT(*) FROM questions q WHERE q.session_id = $1 {published_filter}",
        session_id,
    )
    current_count = int(current_count or 0)

    cache_key = f"{session_id}:{published_only}"
    cached = _REPORT_CACHE.get(cache_key)
    if cached:
        age_sec = now - cached["built_at"]
        new_questions = current_count - cached["question_count"]
        if age_sec < _CACHE_TTL_SEC and new_questions < _CACHE_QUESTION_THRESHOLD:
            return cached["report"]

    rows = await db.fetch(
        f"""
        SELECT
            q.id                  AS question_id,
            q.content             AS question_content,
            q.asked_at,
            q.student_id,
            q.professor_labels    AS professor_labels,
            q.professor_notes     AS professor_notes,
            a.id                  AS answer_id,
            a.content             AS answer_content,
            a.model_used,
            a.generation_latency_ms,
            COALESCE((SELECT COUNT(*) FROM answer_feedback af
                      WHERE af.answer_id = a.id AND af.feedback = 'up'), 0)   AS thumbs_up,
            COALESCE((SELECT COUNT(*) FROM answer_feedback af
                      WHERE af.answer_id = a.id AND af.feedback = 'down'), 0) AS thumbs_down
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.session_id = $1
        {published_filter}
        ORDER BY q.asked_at ASC
        """,
        session_id,
    )

    if not rows:
        return SessionReportResponse(groups=[], total_questions=0)

    sorted_student_ids = sorted({str(r["student_id"]) for r in rows})
    report_items: dict[str, ReportQuestionOut] = {}

    for row in rows:
        answer = None
        if row["answer_id"]:
            citation_rows = await db.fetch(
                """
                SELECT ac.chunk_id, dc.content, dc.page_number,
                       ac.relevance_score, ac.citation_order
                FROM answer_citations ac
                JOIN document_chunks dc ON dc.id = ac.chunk_id
                WHERE ac.answer_id = $1
                ORDER BY ac.citation_order
                """,
                row["answer_id"],
            )
            up, down = int(row["thumbs_up"]), int(row["thumbs_down"])
            feedback = AnswerFeedbackOut(
                thumbs_up=up,
                thumbs_down=down,
                needs_attention=down > up,
            )
            answer = AnswerOut(
                answer_id=str(row["answer_id"]),
                content=row["answer_content"],
                model_used=row["model_used"],
                generation_latency_ms=row["generation_latency_ms"],
                citations=[
                    CitationOut(
                        chunk_id=str(cr["chunk_id"]),
                        content=cr["content"],
                        page_number=cr["page_number"],
                        relevance_score=cr["relevance_score"],
                        citation_order=cr["citation_order"],
                    )
                    for cr in citation_rows
                ],
            )
        else:
            feedback = None

        qid = str(row["question_id"])
        report_items[qid] = ReportQuestionOut(
            question_id=qid,
            content=row["question_content"],
            asked_at=row["asked_at"],
            anonymous_name=_animal_name(str(row["student_id"]), sorted_student_ids),
            answer=answer,
            feedback=feedback,
            professor_labels=list(row["professor_labels"]) if include_review_data and row["professor_labels"] else [],
            professor_notes=row["professor_notes"] if include_review_data else None,
        )

    question_list = [{"question_id": qid, "content": item.content} for qid, item in report_items.items()]

    # Run clustering and repeating-question detection in parallel
    raw_groups, repeating_raw = await asyncio.gather(
        asyncio.to_thread(openai_client.cluster_questions_by_topic, question_list),
        asyncio.to_thread(openai_client.identify_repeating_questions, question_list),
    )

    # Summarize with topic context
    summary_data = await asyncio.to_thread(
        openai_client.summarize_questions_for_dashboard,
        question_list,
        raw_groups,
    )

    qid_to_student: dict[str, str] = {str(r["question_id"]): str(r["student_id"]) for r in rows}
    topic_summary_map = {ts["topic_name"]: ts.get("summary", "") for ts in summary_data.get("topic_summaries", [])}
    hot_topics_set = set(summary_data.get("hot_topics", []))

    topic_groups: list[TopicGroup] = []
    assigned: set[str] = set()

    for g in raw_groups:
        qids = [qid for qid in g.get("question_ids", []) if qid in report_items]
        if not qids:
            continue
        assigned.update(qids)
        topic_name = g.get("topic_name", "General")
        distinct_students = len({qid_to_student[qid] for qid in qids if qid in qid_to_student})
        topic_groups.append(TopicGroup(
            topic_name=topic_name,
            student_count=distinct_students,
            question_count=len(qids),
            questions=[report_items[qid] for qid in qids],
            summary=topic_summary_map.get(topic_name),
            is_hot=topic_name in hot_topics_set,
        ))

    unassigned = [report_items[qid] for qid in report_items if qid not in assigned]
    if unassigned:
        topic_groups.append(TopicGroup(
            topic_name="Other",
            student_count=len({qid_to_student[q.question_id] for q in unassigned}),
            question_count=len(unassigned),
            questions=unassigned,
            summary=topic_summary_map.get("Other"),
            is_hot="Other" in hot_topics_set,
        ))

    repeating_questions = [
        RepeatingQuestionGroup(
            summary=r.get("summary", ""),
            question_ids=r.get("question_ids", []),
            count=r.get("count", 0),
        )
        for r in repeating_raw
    ]

    report = SessionReportResponse(
        groups=topic_groups,
        total_questions=len(report_items),
        session_summary=summary_data.get("session_summary") or None,
        repeating_questions=repeating_questions,
        hot_topics=summary_data.get("hot_topics", []),
    )

    _REPORT_CACHE[cache_key] = {
        "report": report,
        "built_at": now,
        "question_count": len(report_items),
    }
    return report
