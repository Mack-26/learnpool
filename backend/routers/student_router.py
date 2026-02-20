from fastapi import APIRouter, Depends, HTTPException, Request, status

from auth import get_current_user
from database import get_db
import asyncio

from models import (
    AnswerFeedbackOut,
    CourseOut,
    DocumentOut,
    PostQuestionRequest,
    QuestionOut,
    AnswerOut,
    CitationOut,
    ReportQuestionOut,
    SessionCheckResponse,
    SessionReportResponse,
    SessionSummary,
    SubmitFeedbackRequest,
    TopicGroup,
)
from services import openai_client
from services import rag_service

router = APIRouter(prefix="/api/student", tags=["student"])


def _require_student(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students only")
    return current_user


# ---------------------------------------------------------------------------
# GET /api/student/courses
# ---------------------------------------------------------------------------

@router.get("/courses", response_model=list[CourseOut])
async def get_courses(
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    rows = await db.fetch(
        """
        SELECT c.id, c.name, c.description, u.display_name AS professor_name,
               COUNT(s.id) AS session_count
        FROM courses c
        JOIN course_enrollments ce ON c.id = ce.course_id
        JOIN users u ON c.professor_id = u.id
        LEFT JOIN sessions s ON s.course_id = c.id
        WHERE ce.student_id = $1
        GROUP BY c.id, c.name, c.description, u.display_name
        ORDER BY c.name
        """,
        current_user["id"],
    )
    return [
        CourseOut(
            id=str(r["id"]),
            name=r["name"],
            description=r["description"],
            professor_name=r["professor_name"],
            session_count=r["session_count"],
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# GET /api/student/courses/{course_id}/sessions
# ---------------------------------------------------------------------------

@router.get("/courses/{course_id}/sessions", response_model=list[SessionSummary])
async def get_sessions_for_course(
    course_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    # Verify enrollment in this course
    enrolled = await db.fetchval(
        "SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        course_id, current_user["id"],
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

    rows = await db.fetch(
        """
        SELECT id, title, status, started_at
        FROM sessions
        WHERE course_id = $1
        ORDER BY started_at DESC
        """,
        course_id,
    )
    return [
        SessionSummary(id=str(r["id"]), title=r["title"], status=r["status"], started_at=r["started_at"])
        for r in rows
    ]


# ---------------------------------------------------------------------------
# GET /api/student/sessions/{session_id}/check
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}/check", response_model=SessionCheckResponse)
async def check_session(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    row = await db.fetchrow(
        """
        SELECT s.id, s.status, ce.student_id
        FROM sessions s
        LEFT JOIN course_enrollments ce
            ON s.course_id = ce.course_id AND ce.student_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return SessionCheckResponse(
        session_id=str(row["id"]),
        enrolled=row["student_id"] is not None,
        session_status=row["status"],
    )


# ---------------------------------------------------------------------------
# GET /api/student/sessions/{session_id}/documents
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}/documents", response_model=list[DocumentOut])
async def get_session_documents(
    session_id: str,
    request: Request,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    rows = await db.fetch(
        """
        SELECT d.id, d.filename, d.storage_path, d.page_count
        FROM documents d
        JOIN session_documents sd ON sd.document_id = d.id
        WHERE sd.session_id = $1
          AND sd.is_active = true
          AND d.processing_status = 'ready'
        ORDER BY d.filename
        """,
        session_id,
    )
    base = str(request.base_url).rstrip("/")
    return [
        DocumentOut(
            id=str(r["id"]),
            filename=r["filename"],
            storage_path=r["storage_path"],
            url=f"{base}/uploads/{r['storage_path']}",
            page_count=r["page_count"],
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# GET /api/student/sessions (legacy — kept for backwards compat)
# ---------------------------------------------------------------------------

@router.get("/sessions", response_model=list[SessionSummary])
async def get_all_sessions(
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    rows = await db.fetch(
        """
        SELECT s.id, s.title, s.status, s.started_at
        FROM sessions s
        JOIN course_enrollments ce ON s.course_id = ce.course_id
        WHERE ce.student_id = $1
        ORDER BY s.started_at DESC
        """,
        current_user["id"],
    )
    return [SessionSummary(id=str(r["id"]), title=r["title"], status=r["status"], started_at=r["started_at"]) for r in rows]


# ---------------------------------------------------------------------------
# POST /api/student/sessions/{session_id}/questions
# ---------------------------------------------------------------------------

@router.post("/sessions/{session_id}/questions", response_model=QuestionOut)
async def post_question(
    session_id: str,
    body: PostQuestionRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    session_row = await db.fetchrow(
        """
        SELECT s.id, s.status
        FROM sessions s
        JOIN course_enrollments ce ON s.course_id = ce.course_id AND ce.student_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not session_row:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this session's course")
    if session_row["status"] != "active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Session is {session_row['status']}, not active")

    return await rag_service.handle_question(
        session_id=session_id,
        student_id=str(current_user["id"]),
        content=body.content,
        db=db,
        personality=body.personality,
    )


# ---------------------------------------------------------------------------
# GET /api/student/sessions/{session_id}/report  (anonymised class-wide Q&A)
# ---------------------------------------------------------------------------

_ANIMALS = [
    "Lion", "Tiger", "Bear", "Wolf", "Eagle", "Dolphin", "Fox", "Owl",
    "Hawk", "Panther", "Jaguar", "Falcon", "Lynx", "Puma", "Raven",
    "Cobra", "Orca", "Cheetah", "Moose", "Bison", "Rhino", "Giraffe",
    "Penguin", "Puffin", "Meerkat", "Capybara", "Octopus", "Narwhal",
    "Platypus", "Axolotl",
]


def _animal_name(student_id: str, sorted_student_ids: list[str]) -> str:
    """Return a consistent 'Anonymous <Animal>' for this student within the session."""
    try:
        idx = sorted_student_ids.index(student_id)
    except ValueError:
        idx = hash(student_id)
    return f"Anonymous {_ANIMALS[idx % len(_ANIMALS)]}"


@router.get("/sessions/{session_id}/report", response_model=SessionReportResponse)
async def get_session_report(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """
    Returns all Q&A for the session, anonymised and grouped by topic.
    Topic clustering is done via GPT-4o-mini.
    """
    enrolled = await db.fetchval(
        """
        SELECT 1 FROM sessions s
        JOIN course_enrollments ce ON s.course_id = ce.course_id AND ce.student_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this session's course")

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

    # Build sorted student list for consistent animal assignment
    sorted_student_ids = sorted({str(r["student_id"]) for r in rows})

    # Build ReportQuestionOut objects (without topic assignment yet)
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

    # Cluster questions by topic via GPT (runs in thread pool to not block event loop)
    question_list = [{"question_id": qid, "content": item.content} for qid, item in report_items.items()]
    raw_groups: list[dict] = await asyncio.to_thread(
        openai_client.cluster_questions_by_topic, question_list
    )

    # Map question_id → student_id for distinct-student counting
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

    # Catch any questions GPT didn't assign to a group
    unassigned = [report_items[qid] for qid in report_items if qid not in assigned]
    if unassigned:
        topic_groups.append(TopicGroup(
            topic_name="Other",
            student_count=len({qid_to_student[q.question_id] for q in unassigned}),
            question_count=len(unassigned),
            questions=unassigned,
        ))

    return SessionReportResponse(groups=topic_groups, total_questions=len(report_items))


# ---------------------------------------------------------------------------
# POST /api/student/answers/{answer_id}/feedback
# ---------------------------------------------------------------------------

@router.post("/answers/{answer_id}/feedback")
async def submit_feedback(
    answer_id: str,
    body: SubmitFeedbackRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Upserts a student's thumbs-up/down on an AI answer. Returns updated counts."""
    # Verify the answer belongs to a session the student is enrolled in
    enrolled = await db.fetchval(
        """
        SELECT 1 FROM answers a
        JOIN questions q ON q.id = a.question_id
        JOIN sessions s ON s.id = q.session_id
        JOIN course_enrollments ce ON ce.course_id = s.course_id AND ce.student_id = $1
        WHERE a.id = $2
        """,
        current_user["id"],
        answer_id,
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot rate this answer")

    await db.execute(
        """
        INSERT INTO answer_feedback (answer_id, student_id, feedback)
        VALUES ($1, $2, $3)
        ON CONFLICT (answer_id, student_id)
        DO UPDATE SET feedback = EXCLUDED.feedback, created_at = now()
        """,
        answer_id,
        str(current_user["id"]),
        body.feedback,
    )

    counts = await db.fetchrow(
        """
        SELECT
            COALESCE(SUM(CASE WHEN feedback = 'up'   THEN 1 ELSE 0 END), 0) AS thumbs_up,
            COALESCE(SUM(CASE WHEN feedback = 'down' THEN 1 ELSE 0 END), 0) AS thumbs_down
        FROM answer_feedback WHERE answer_id = $1
        """,
        answer_id,
    )
    return {"thumbs_up": int(counts["thumbs_up"]), "thumbs_down": int(counts["thumbs_down"])}


# ---------------------------------------------------------------------------
# GET /api/student/sessions/{session_id}/questions
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}/questions", response_model=list[QuestionOut])
async def get_questions(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
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
            a.generation_latency_ms
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.session_id = $1
          AND q.student_id = $2
        ORDER BY q.asked_at ASC
        """,
        session_id,
        current_user["id"],
    )

    results = []
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

        results.append(QuestionOut(
            question_id=str(row["question_id"]),
            content=row["question_content"],
            asked_at=row["asked_at"],
            student_id=str(row["student_id"]),
            answer=answer,
        ))

    return results
