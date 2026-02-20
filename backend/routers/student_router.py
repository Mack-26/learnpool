from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from database import get_db

from models import (
    AnswerFeedbackOut,
    CourseOut,
    DocumentOut,
    PostQuestionRequest,
    PublishQuestionsRequest,
    QuestionOut,
    AnswerOut,
    CitationOut,
    ReportQuestionOut,
    SessionCheckResponse,
    SessionReportResponse,
    SessionSummary,
    SessionWithDocuments,
    SubmitFeedbackRequest,
    TopicGroup,
)
from services import openai_client
from services import rag_service
from services.report_service import build_session_report, invalidate_report_cache_for_session

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
# GET /api/student/courses/{course_id}/sessions-with-documents
# ---------------------------------------------------------------------------

@router.get("/courses/{course_id}/sessions-with-documents", response_model=list[SessionWithDocuments])
async def get_sessions_with_documents(
    course_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """List sessions with their attached documents for lecture materials view."""
    enrolled = await db.fetchval(
        "SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        course_id,
        current_user["id"],
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this course")

    sessions = await db.fetch(
        """
        SELECT id, title, status, started_at
        FROM sessions
        WHERE course_id = $1
        ORDER BY started_at DESC
        """,
        course_id,
    )

    result = []
    for s in sessions:
        doc_rows = await db.fetch(
            """
            SELECT d.id, d.filename, d.storage_path, d.page_count, d.content
            FROM documents d
            JOIN session_documents sd ON sd.document_id = d.id AND sd.is_active = true
            WHERE sd.session_id = $1
              AND d.processing_status = 'ready'
            ORDER BY d.filename
            """,
            s["id"],
        )
        documents = [
            DocumentOut(
                id=str(r["id"]),
                filename=r["filename"],
                storage_path=r["storage_path"],
                url=f"/uploads/{r['storage_path']}" if r["storage_path"] != "inline" else "",
                page_count=r["page_count"],
                content=r.get("content"),
            )
            for r in doc_rows
        ]
        result.append(
            SessionWithDocuments(
                id=str(s["id"]),
                title=s["title"],
                status=s["status"],
                started_at=s["started_at"],
                documents=documents,
            )
        )
    return result


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
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    rows = await db.fetch(
        """
        SELECT d.id, d.filename, d.storage_path, d.page_count, d.content
        FROM documents d
        JOIN session_documents sd ON sd.document_id = d.id
        WHERE sd.session_id = $1
          AND sd.is_active = true
          AND d.processing_status = 'ready'
        ORDER BY d.filename
        """,
        session_id,
    )
    return [
        DocumentOut(
            id=str(r["id"]),
            filename=r["filename"],
            storage_path=r["storage_path"],
            url=f"/uploads/{r['storage_path']}" if r["storage_path"] != "inline" else "",
            page_count=r["page_count"],
            content=r.get("content"),
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
    if session_row["status"] not in ("active", "released"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Lecture is {session_row['status']}; Q&A is closed")

    return await rag_service.handle_question(
        session_id=session_id,
        student_id=str(current_user["id"]),
        content=body.content,
        db=db,
        personality=body.personality,
        anonymous=body.anonymous,
    )


# ---------------------------------------------------------------------------
# GET /api/student/sessions/{session_id}/report  (anonymised class-wide Q&A)
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}/report", response_model=SessionReportResponse)
async def get_session_report(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Returns published Q&A for the session, anonymised and grouped by topic."""
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

    return await build_session_report(db, session_id, published_only=False)


# ---------------------------------------------------------------------------
# POST /api/student/sessions/{session_id}/publish
# ---------------------------------------------------------------------------

@router.post("/sessions/{session_id}/publish")
async def publish_questions(
    session_id: str,
    body: PublishQuestionsRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Mark selected questions as published so they appear in the class discussion bank."""
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

    result = await db.execute(
        """
        UPDATE questions
           SET published = true
         WHERE id = ANY($1::uuid[])
           AND session_id = $2
           AND student_id = $3
        """,
        body.question_ids,
        session_id,
        str(current_user["id"]),
    )
    # asyncpg returns "UPDATE N" — parse count
    published_count = int(result.split()[-1]) if result else 0
    return {"published_count": published_count}


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

    session_id = await db.fetchval(
        "SELECT session_id FROM questions q JOIN answers a ON a.question_id = q.id WHERE a.id = $1",
        answer_id,
    )
    if session_id:
        invalidate_report_cache_for_session(str(session_id))

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
            q.anonymous,
            q.published,
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
            anonymous=row["anonymous"],
            published=row["published"],
            answer=answer,
        ))

    return results
