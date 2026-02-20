"""Shared report building logic for session Q&A (student and professor)."""

import asyncio

from services import openai_client
from models import (
    AnswerOut,
    AnswerFeedbackOut,
    CitationOut,
    ReportQuestionOut,
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


async def build_session_report(db, session_id: str) -> SessionReportResponse:
    """Build anonymised Q&A report for a session. Caller must verify access."""
    rows = await db.fetch(
        """
        SELECT
            q.id          AS question_id,
            q.content     AS question_content,
            q.asked_at,
            q.student_id,
            a.id          AS answer_id,
            a.content     AS answer_content,
            a.model_used,
            a.generation_latency_ms,
            COALESCE((SELECT COUNT(*) FROM answer_feedback af
                      WHERE af.answer_id = a.id AND af.feedback = 'up'), 0)   AS thumbs_up,
            COALESCE((SELECT COUNT(*) FROM answer_feedback af
                      WHERE af.answer_id = a.id AND af.feedback = 'down'), 0) AS thumbs_down
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.session_id = $1
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
        )

    question_list = [{"question_id": qid, "content": item.content} for qid, item in report_items.items()]
    raw_groups: list[dict] = await asyncio.to_thread(
        openai_client.cluster_questions_by_topic, question_list
    )

    qid_to_student: dict[str, str] = {str(r["question_id"]): str(r["student_id"]) for r in rows}
    topic_groups: list[TopicGroup] = []
    assigned: set[str] = set()

    for g in raw_groups:
        qids = [qid for qid in g.get("question_ids", []) if qid in report_items]
        if not qids:
            continue
        assigned.update(qids)
        distinct_students = len({qid_to_student[qid] for qid in qids if qid in qid_to_student})
        topic_groups.append(TopicGroup(
            topic_name=g.get("topic_name", "General"),
            student_count=distinct_students,
            question_count=len(qids),
            questions=[report_items[qid] for qid in qids],
        ))

    unassigned = [report_items[qid] for qid in report_items if qid not in assigned]
    if unassigned:
        topic_groups.append(TopicGroup(
            topic_name="Other",
            student_count=len({qid_to_student[q.question_id] for q in unassigned}),
            question_count=len(unassigned),
            questions=unassigned,
        ))

    return SessionReportResponse(groups=topic_groups, total_questions=len(report_items))
