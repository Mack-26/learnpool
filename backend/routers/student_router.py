from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from database import get_db

from models import (
    AnswerFeedbackOut,
    CitationPageOut,
    ClassmateOut,
    CommentOut,
    CourseOut,
    CreateCommentRequest,
    CreateThreadRequest,
    DocumentCitationOut,
    DocumentOut,
    ForkThreadRequest,
    JoinCourseRequest,
    PostQuestionRequest,
    PublishQuestionsRequest,
    QuestionOut,
    AnswerOut,
    CitationOut,
    ReportQuestionOut,
    RichThreadExchange,
    RichThreadOut,
    SavedAnswerOut,
    SessionCheckResponse,
    SessionReportResponse,
    SessionSummary,
    SessionWithDocuments,
    ShareThreadRequest,
    SharedThreadExchange,
    SharedThreadOut,
    SubmitFeedbackRequest,
    SubmitThreadFeedbackRequest,
    ThreadFeedbackOut,
    TopicGroup,
)
from config import settings
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

    is_enrolled = row["student_id"] is not None
    questions_used = 0
    if is_enrolled:
        questions_used = int(await db.fetchval(
            "SELECT COUNT(*) FROM questions WHERE session_id = $1 AND student_id = $2",
            session_id,
            current_user["id"],
        ) or 0)

    return SessionCheckResponse(
        session_id=str(row["id"]),
        enrolled=is_enrolled,
        session_status=row["status"],
        questions_used=questions_used,
        questions_limit=settings.max_questions_per_session,
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

    question_count = await db.fetchval(
        "SELECT COUNT(*) FROM questions WHERE session_id = $1 AND student_id = $2",
        session_id,
        str(current_user["id"]),
    )
    if question_count >= settings.max_questions_per_session:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You've reached the {settings.max_questions_per_session}-question limit for this session.",
        )

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
            q.id              AS question_id,
            q.content         AS question_content,
            q.asked_at,
            q.student_id,
            q.anonymous,
            a.id              AS answer_id,
            a.content         AS answer_content,
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
                       ac.relevance_score, ac.citation_order,
                       d.filename, d.id AS document_id
                FROM answer_citations ac
                JOIN document_chunks dc ON dc.id = ac.chunk_id
                JOIN documents d ON d.id = dc.document_id
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
                        filename=cr["filename"],
                        document_id=str(cr["document_id"]) if cr["document_id"] else None,
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
            answer=answer,
        ))

    return results


# ---------------------------------------------------------------------------
# GET /api/student/questions/{question_id}/comments
# ---------------------------------------------------------------------------

@router.get("/questions/{question_id}/comments", response_model=list[CommentOut])
async def get_question_comments(
    question_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Get comments for a question. Student must be enrolled in the session's course."""
    enrolled = await db.fetchval(
        """
        SELECT 1 FROM questions q
        JOIN sessions s ON s.id = q.session_id
        JOIN course_enrollments ce ON ce.course_id = s.course_id AND ce.student_id = $1
        WHERE q.id = $2
        """,
        current_user["id"],
        question_id,
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this session's course")

    rows = await db.fetch(
        """
        SELECT qc.id, qc.user_id, u.display_name, u.role, qc.content, qc.created_at
        FROM question_comments qc
        JOIN users u ON u.id = qc.user_id
        WHERE qc.question_id = $1
        ORDER BY qc.created_at ASC
        """,
        question_id,
    )
    return [
        CommentOut(
            comment_id=str(r["id"]),
            user_id=str(r["user_id"]),
            display_name=r["display_name"],
            role=r["role"],
            content=r["content"],
            created_at=r["created_at"],
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# POST /api/student/questions/{question_id}/comments
# ---------------------------------------------------------------------------

@router.post("/questions/{question_id}/comments", response_model=CommentOut)
async def post_question_comment(
    question_id: str,
    body: CreateCommentRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Post a comment on a question."""
    enrolled = await db.fetchval(
        """
        SELECT 1 FROM questions q
        JOIN sessions s ON s.id = q.session_id
        JOIN course_enrollments ce ON ce.course_id = s.course_id AND ce.student_id = $1
        WHERE q.id = $2
        """,
        current_user["id"],
        question_id,
    )
    if not enrolled:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this session's course")

    row = await db.fetchrow(
        """
        INSERT INTO question_comments (question_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, created_at
        """,
        question_id,
        str(current_user["id"]),
        body.content,
    )
    return CommentOut(
        comment_id=str(row["id"]),
        user_id=str(current_user["id"]),
        display_name=current_user["display_name"],
        role=current_user["role"],
        content=body.content,
        created_at=row["created_at"],
    )


# ---------------------------------------------------------------------------
# POST /api/student/questions/{question_id}/fork
# ---------------------------------------------------------------------------

@router.post("/questions/{question_id}/fork", response_model=QuestionOut)
async def fork_question(
    question_id: str,
    body: PostQuestionRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Fork a question — creates a new question with parent Q&A as context, increments parent fork_count."""
    # Verify access to original question
    parent = await db.fetchrow(
        """
        SELECT q.id, q.content, q.session_id, s.status,
               a.content AS answer_content
        FROM questions q
        JOIN sessions s ON s.id = q.session_id
        JOIN course_enrollments ce ON ce.course_id = s.course_id AND ce.student_id = $1
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.id = $2
        """,
        current_user["id"],
        question_id,
    )
    if not parent:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled or question not found")

    session_id = str(parent["session_id"])

    question_count = await db.fetchval(
        "SELECT COUNT(*) FROM questions WHERE session_id = $1 AND student_id = $2",
        session_id,
        str(current_user["id"]),
    )
    if question_count >= settings.max_questions_per_session:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"You've reached the {settings.max_questions_per_session}-question limit for this session.",
        )

    # Increment parent fork_count
    await db.execute(
        "UPDATE questions SET fork_count = COALESCE(fork_count, 0) + 1 WHERE id = $1",
        question_id,
    )

    # Build fork: prepend parent context to question content, save forked_from
    parent_context = f"[Forked from: \"{parent['content'][:100]}\"]\n\n"
    fork_content = parent_context + body.content

    result = await rag_service.handle_question(
        session_id=session_id,
        student_id=str(current_user["id"]),
        content=fork_content,
        db=db,
        personality=body.personality,
        anonymous=body.anonymous,
    )

    # Set forked_from on the new question
    await db.execute(
        "UPDATE questions SET forked_from = $1 WHERE id = $2",
        question_id,
        result.question_id,
    )

    invalidate_report_cache_for_session(session_id)
    return result


# ---------------------------------------------------------------------------
# POST /api/student/answers/{answer_id}/save
# ---------------------------------------------------------------------------

@router.post("/answers/{answer_id}/save")
async def save_answer(
    answer_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Save an AI answer to the student's personal notes."""
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled in this session's course")

    row = await db.fetchrow(
        """
        INSERT INTO saved_answers (student_id, answer_id)
        VALUES ($1, $2)
        ON CONFLICT (student_id, answer_id) DO UPDATE SET saved_at = saved_answers.saved_at
        RETURNING id
        """,
        current_user["id"],
        answer_id,
    )
    return {"save_id": str(row["id"]), "saved": True}


# ---------------------------------------------------------------------------
# DELETE /api/student/answers/{answer_id}/save
# ---------------------------------------------------------------------------

@router.delete("/answers/{answer_id}/save")
async def unsave_answer(
    answer_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Remove an AI answer from the student's personal notes."""
    await db.execute(
        "DELETE FROM saved_answers WHERE student_id = $1 AND answer_id = $2",
        current_user["id"],
        answer_id,
    )
    return {"saved": False}


# ---------------------------------------------------------------------------
# GET /api/student/notes
# ---------------------------------------------------------------------------

@router.get("/notes", response_model=list[SavedAnswerOut])
async def get_saved_answers(
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Return all saved answers for the current student, newest first."""
    rows = await db.fetch(
        """
        SELECT sa.id AS save_id, sa.answer_id, sa.saved_at,
               q.content AS question_content,
               a.content AS answer_content,
               s.id AS session_id, s.title AS session_title
        FROM saved_answers sa
        JOIN answers a ON a.id = sa.answer_id
        JOIN questions q ON q.id = a.question_id
        JOIN sessions s ON s.id = q.session_id
        WHERE sa.student_id = $1
        ORDER BY sa.saved_at DESC
        """,
        current_user["id"],
    )

    if not rows:
        return []

    answer_ids = [str(r["answer_id"]) for r in rows]
    citation_rows = await db.fetch(
        """
        SELECT ac.answer_id, ac.chunk_id, dc.content, dc.page_number,
               ac.relevance_score, ac.citation_order,
               d.filename, d.id AS document_id
        FROM answer_citations ac
        JOIN document_chunks dc ON dc.id = ac.chunk_id
        JOIN documents d ON d.id = dc.document_id
        WHERE ac.answer_id = ANY($1::uuid[])
        ORDER BY ac.answer_id, ac.citation_order
        """,
        answer_ids,
    )

    citations_by_answer: dict[str, list[CitationOut]] = {}
    for cr in citation_rows:
        aid = str(cr["answer_id"])
        citations_by_answer.setdefault(aid, []).append(CitationOut(
            chunk_id=str(cr["chunk_id"]),
            content=cr["content"],
            page_number=cr["page_number"],
            relevance_score=cr["relevance_score"],
            citation_order=cr["citation_order"],
            filename=cr["filename"],
            document_id=str(cr["document_id"]) if cr["document_id"] else None,
        ))

    return [
        SavedAnswerOut(
            save_id=str(r["save_id"]),
            answer_id=str(r["answer_id"]),
            question_content=r["question_content"],
            answer_content=r["answer_content"],
            saved_at=r["saved_at"],
            session_id=str(r["session_id"]),
            session_title=r["session_title"],
            citations=citations_by_answer.get(str(r["answer_id"]), []),
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# POST /api/student/sessions/{session_id}/threads
# ---------------------------------------------------------------------------

@router.post("/sessions/{session_id}/threads", response_model=SharedThreadOut)
async def create_thread(
    session_id: str,
    body: CreateThreadRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Create a shared thread from selected question IDs (WhatsApp-style sharing)."""
    valid_count = await db.fetchval(
        """
        SELECT COUNT(*) FROM questions
        WHERE id = ANY($1::uuid[])
          AND session_id = $2
          AND student_id = $3
        """,
        body.question_ids,
        session_id,
        str(current_user["id"]),
    )
    if int(valid_count) != len(body.question_ids):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid question IDs")

    t_row = await db.fetchrow(
        """
        INSERT INTO threads (session_id, student_id, title, shared, shared_at, include_questions)
        VALUES ($1, $2, $3, true, now(), $4)
        RETURNING id, title, shared_at
        """,
        session_id,
        str(current_user["id"]),
        body.title,
        body.include_questions,
    )
    thread_id = str(t_row["id"])

    for i, q_id in enumerate(body.question_ids):
        await db.execute(
            "UPDATE questions SET thread_id = $1, thread_sequence = $2 WHERE id = $3",
            thread_id,
            i + 1,
            q_id,
        )

    q_rows = await db.fetch(
        """
        SELECT q.content,
               a.content AS answer_content,
               (SELECT COUNT(*) FROM answer_citations ac WHERE ac.answer_id = a.id) AS citations_count
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.thread_id = $1
        ORDER BY q.thread_sequence ASC
        """,
        thread_id,
    )

    exchanges = [
        SharedThreadExchange(
            question=r["content"] if body.include_questions else "",
            answer=r["answer_content"] or "",
            citations_count=int(r["citations_count"]),
        )
        for r in q_rows
    ]

    return SharedThreadOut(
        thread_id=thread_id,
        title=t_row["title"],
        exchange_count=len(exchanges),
        shared_at=t_row["shared_at"],
        exchanges=exchanges,
        include_questions=body.include_questions,
    )


# ---------------------------------------------------------------------------
# GET /api/student/sessions/{session_id}/shared-threads
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}/shared-threads", response_model=list[RichThreadOut])
async def get_shared_threads(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Return all shared threads for a session as rich thread objects."""
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled")

    return await _fetch_rich_threads(db, session_id, str(current_user["id"]))


# ---------------------------------------------------------------------------
# GET /api/student/threads/{thread_id}/comments
# ---------------------------------------------------------------------------

@router.get("/threads/{thread_id}/comments", response_model=list[CommentOut])
async def get_thread_comments(
    thread_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    await _require_thread_enrollment(db, thread_id, str(current_user["id"]))
    rows = await db.fetch(
        """
        SELECT tc.id, tc.user_id, u.display_name, u.role, tc.content, tc.created_at
        FROM thread_comments tc
        JOIN users u ON u.id = tc.user_id
        WHERE tc.thread_id = $1
        ORDER BY tc.created_at ASC
        """,
        thread_id,
    )
    return [CommentOut(comment_id=str(r["id"]), user_id=str(r["user_id"]),
                       display_name=r["display_name"], role=r["role"],
                       content=r["content"], created_at=r["created_at"]) for r in rows]


# ---------------------------------------------------------------------------
# POST /api/student/threads/{thread_id}/comments
# ---------------------------------------------------------------------------

@router.post("/threads/{thread_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def post_thread_comment(
    thread_id: str,
    body: CreateCommentRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    await _require_thread_enrollment(db, thread_id, str(current_user["id"]))
    row = await db.fetchrow(
        "INSERT INTO thread_comments (thread_id, user_id, content) VALUES ($1, $2, $3) RETURNING id, created_at",
        thread_id, str(current_user["id"]), body.content,
    )
    return CommentOut(
        comment_id=str(row["id"]), user_id=str(current_user["id"]),
        display_name=current_user["display_name"], role="student",
        content=body.content, created_at=row["created_at"],
    )


# ---------------------------------------------------------------------------
# POST /api/student/threads/{thread_id}/feedback
# ---------------------------------------------------------------------------

@router.post("/threads/{thread_id}/feedback", response_model=ThreadFeedbackOut)
async def submit_thread_feedback(
    thread_id: str,
    body: SubmitThreadFeedbackRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    await _require_thread_enrollment(db, thread_id, str(current_user["id"]))
    await db.execute(
        """
        INSERT INTO thread_feedback (thread_id, user_id, feedback)
        VALUES ($1, $2, $3)
        ON CONFLICT (thread_id, user_id) DO UPDATE SET feedback = EXCLUDED.feedback, created_at = now()
        """,
        thread_id, str(current_user["id"]), body.feedback,
    )
    return await _thread_feedback_counts(db, thread_id)


# ---------------------------------------------------------------------------
# POST /api/student/threads/{thread_id}/fork
# ---------------------------------------------------------------------------

@router.post("/threads/{thread_id}/fork", response_model=RichThreadOut, status_code=status.HTTP_201_CREATED)
async def fork_thread(
    thread_id: str,
    body: ForkThreadRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Fork a shared thread: runs RAG on a new question with original thread as context, creates a new shared thread."""
    # Resolve thread → session
    thread_row = await db.fetchrow(
        "SELECT session_id, title, include_questions FROM threads WHERE id = $1 AND shared = true",
        thread_id,
    )
    if not thread_row:
        raise HTTPException(status_code=404, detail="Thread not found")
    session_id = str(thread_row["session_id"])

    enrolled = await db.fetchval(
        """
        SELECT 1 FROM sessions s
        JOIN course_enrollments ce ON s.course_id = ce.course_id AND ce.student_id = $1
        WHERE s.id = $2
        """,
        str(current_user["id"]), session_id,
    )
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled")

    # Check question limit
    q_count = await db.fetchval(
        "SELECT COUNT(*) FROM questions WHERE session_id = $1 AND student_id = $2",
        session_id, str(current_user["id"]),
    )
    if int(q_count) >= settings.max_questions_per_session:
        raise HTTPException(status_code=429, detail="Question limit reached")

    # Build context from original thread exchanges
    exchange_rows = await db.fetch(
        """
        SELECT q.content, a.content AS answer
        FROM questions q LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.thread_id = $1 ORDER BY q.thread_sequence ASC
        """,
        thread_id,
    )
    original_title = thread_row["title"] or (exchange_rows[0]["content"][:60] if exchange_rows else "thread")
    context_prefix = f'[Forked from: "{original_title}"]\n\n'
    fork_content = context_prefix + body.content

    # Run RAG pipeline
    import asyncio
    question_out = await rag_service.handle_question(
        session_id=session_id,
        student_id=str(current_user["id"]),
        content=fork_content,
        db=db,
        personality=body.personality,
        anonymous=False,
    )

    # Create new thread and link the question
    new_thread_row = await db.fetchrow(
        """
        INSERT INTO threads (session_id, student_id, title, shared, shared_at, forked_from, include_questions)
        VALUES ($1, $2, $3, true, now(), $4, true)
        RETURNING id
        """,
        session_id, str(current_user["id"]),
        body.title or body.content[:80],
        thread_id,
    )
    new_thread_id = str(new_thread_row["id"])

    await db.execute(
        "UPDATE questions SET thread_id = $1, thread_sequence = 1 WHERE id = $2",
        new_thread_id, question_out.question_id,
    )
    await db.execute(
        "UPDATE threads SET fork_count = fork_count + 1 WHERE id = $1",
        thread_id,
    )

    threads = await _fetch_rich_threads(db, session_id, str(current_user["id"]), thread_id=new_thread_id)
    return threads[0]


# ---------------------------------------------------------------------------
# GET /api/student/sessions/{session_id}/citation-map
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}/citation-map", response_model=list[DocumentCitationOut])
async def get_student_citation_map(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Return per-document, per-page citation frequency for all questions in a session."""
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enrolled")

    rows = await db.fetch(
        """
        SELECT d.id AS document_id, d.filename, d.page_count,
               dc.page_number,
               COUNT(ac.id) AS citation_count,
               ROUND(AVG(ac.relevance_score)::numeric, 3) AS avg_relevance
        FROM answer_citations ac
        JOIN document_chunks dc ON dc.id = ac.chunk_id
        JOIN documents d ON d.id = dc.document_id
        JOIN answers a ON a.id = ac.answer_id
        JOIN questions q ON q.id = a.question_id
        WHERE q.session_id = $1
        GROUP BY d.id, d.filename, d.page_count, dc.page_number
        ORDER BY d.filename, dc.page_number NULLS LAST
        """,
        session_id,
    )

    docs: dict[str, dict] = {}
    for r in rows:
        doc_id = str(r["document_id"])
        if doc_id not in docs:
            docs[doc_id] = {
                "document_id": doc_id,
                "filename": r["filename"],
                "page_count": r["page_count"],
                "total_citations": 0,
                "pages": [],
            }
        count = int(r["citation_count"])
        docs[doc_id]["total_citations"] += count
        docs[doc_id]["pages"].append(CitationPageOut(
            page_number=r["page_number"],
            citation_count=count,
            avg_relevance=float(r["avg_relevance"]),
        ))

    result = sorted(docs.values(), key=lambda d: d["total_citations"], reverse=True)
    return [
        DocumentCitationOut(
            document_id=d["document_id"],
            filename=d["filename"],
            page_count=d["page_count"],
            total_citations=d["total_citations"],
            pages=sorted(d["pages"], key=lambda p: p.citation_count, reverse=True),
        )
        for d in result
    ]


# ---------------------------------------------------------------------------
# Shared helpers
# ---------------------------------------------------------------------------

async def _require_thread_enrollment(db, thread_id: str, student_id: str):
    ok = await db.fetchval(
        """
        SELECT 1 FROM threads t
        JOIN sessions s ON s.id = t.session_id
        JOIN course_enrollments ce ON s.course_id = ce.course_id AND ce.student_id = $1
        WHERE t.id = $2
        """,
        student_id, thread_id,
    )
    if not ok:
        raise HTTPException(status_code=403, detail="Access denied")


async def _thread_feedback_counts(db, thread_id: str, professor_labels: list[str] | None = None) -> ThreadFeedbackOut:
    rows = await db.fetch(
        "SELECT feedback, COUNT(*) AS cnt FROM thread_feedback WHERE thread_id = $1 GROUP BY feedback",
        thread_id,
    )
    up = sum(int(r["cnt"]) for r in rows if r["feedback"] == "up")
    down = sum(int(r["cnt"]) for r in rows if r["feedback"] == "down")
    discussed = "Discussed in class" in (professor_labels or [])
    return ThreadFeedbackOut(thumbs_up=up, thumbs_down=down, needs_attention=(down > up and not discussed))


async def _fetch_rich_threads(db, session_id: str, current_user_id: str, thread_id: str | None = None) -> list[RichThreadOut]:
    """Fetch all shared threads for a session as RichThreadOut, optionally filtering to a single thread."""
    where_extra = "AND t.id = $2" if thread_id else ""
    params: list = [session_id]
    if thread_id:
        params.append(thread_id)

    thread_rows = await db.fetch(
        f"""
        SELECT t.id, t.title, t.shared_at, t.include_questions,
               t.professor_labels, t.professor_notes, t.fork_count, t.forked_from,
               t.student_id,
               COUNT(DISTINCT q.id) AS exchange_count,
               COUNT(DISTINCT tc.id) AS comment_count
        FROM threads t
        LEFT JOIN questions q ON q.thread_id = t.id
        LEFT JOIN thread_comments tc ON tc.thread_id = t.id
        WHERE t.session_id = $1 AND t.shared = true {where_extra}
        GROUP BY t.id, t.title, t.shared_at, t.include_questions,
                 t.professor_labels, t.professor_notes, t.fork_count, t.forked_from, t.student_id
        ORDER BY t.shared_at DESC
        """,
        *params,
    )

    if not thread_rows:
        return []

    thread_ids = [str(r["id"]) for r in thread_rows]

    # Exchanges
    exchange_rows = await db.fetch(
        """
        SELECT q.thread_id, q.content AS question, q.thread_sequence,
               a.content AS answer, a.id AS answer_id, q.category
        FROM questions q
        LEFT JOIN answers a ON a.question_id = q.id
        WHERE q.thread_id = ANY($1::uuid[])
        ORDER BY q.thread_id, q.thread_sequence ASC
        """,
        thread_ids,
    )

    # Batch-fetch citations for all answer IDs in one query
    answer_ids = [str(r["answer_id"]) for r in exchange_rows if r["answer_id"]]
    citations_by_answer: dict[str, list[CitationOut]] = {}
    if answer_ids:
        cit_rows = await db.fetch(
            """
            SELECT ac.answer_id, ac.chunk_id, dc.content, dc.page_number,
                   ac.relevance_score, ac.citation_order, d.filename, d.id AS document_id
            FROM answer_citations ac
            JOIN document_chunks dc ON dc.id = ac.chunk_id
            JOIN documents d ON d.id = dc.document_id
            WHERE ac.answer_id = ANY($1::uuid[])
            ORDER BY ac.answer_id, ac.citation_order
            """,
            answer_ids,
        )
        for cr in cit_rows:
            aid = str(cr["answer_id"])
            citations_by_answer.setdefault(aid, []).append(CitationOut(
                chunk_id=str(cr["chunk_id"]),
                content=cr["content"],
                page_number=cr["page_number"],
                relevance_score=cr["relevance_score"],
                citation_order=cr["citation_order"],
                filename=cr["filename"],
                document_id=str(cr["document_id"]) if cr["document_id"] else None,
            ))

    exchanges_by_thread: dict[str, list[RichThreadExchange]] = {}
    for r in exchange_rows:
        tid = str(r["thread_id"])
        exchanges_by_thread.setdefault(tid, [])

    include_q_map = {str(r["id"]): r["include_questions"] for r in thread_rows}
    for r in exchange_rows:
        tid = str(r["thread_id"])
        include_q = include_q_map.get(tid, True)
        aid = str(r["answer_id"]) if r["answer_id"] else None
        exchanges_by_thread[tid].append(RichThreadExchange(
            question=r["question"] if include_q else "",
            answer=r["answer"] or "",
            citations=citations_by_answer.get(aid, []) if aid else [],
            category=r["category"],
        ))

    # Per-thread feedback for current user
    feedback_rows = await db.fetch(
        "SELECT thread_id, feedback FROM thread_feedback WHERE thread_id = ANY($1::uuid[]) AND user_id = $2",
        thread_ids, current_user_id,
    )
    my_feedback_map = {str(r["thread_id"]): r["feedback"] for r in feedback_rows}

    # Aggregate feedback counts
    agg_feedback_rows = await db.fetch(
        "SELECT thread_id, feedback, COUNT(*) AS cnt FROM thread_feedback WHERE thread_id = ANY($1::uuid[]) GROUP BY thread_id, feedback",
        thread_ids,
    )
    up_map: dict[str, int] = {}
    down_map: dict[str, int] = {}
    for r in agg_feedback_rows:
        tid = str(r["thread_id"])
        if r["feedback"] == "up":
            up_map[tid] = int(r["cnt"])
        else:
            down_map[tid] = int(r["cnt"])

    # Anonymize student names per-session (consistent "Student N" mapping)
    anon_rows = await db.fetch(
        """
        SELECT DISTINCT student_id FROM threads
        WHERE session_id = $1 AND shared = true
        ORDER BY student_id
        """,
        session_id,
    )
    anon_map = {str(r["student_id"]): f"Student {i + 1}" for i, r in enumerate(anon_rows)}

    return [
        RichThreadOut(
            thread_id=str(r["id"]),
            title=r["title"],
            exchange_count=int(r["exchange_count"]),
            shared_at=r["shared_at"],
            exchanges=exchanges_by_thread.get(str(r["id"]), []),
            include_questions=r["include_questions"],
            professor_labels=list(r["professor_labels"] or []),
            professor_notes=r["professor_notes"],
            fork_count=int(r["fork_count"]),
            forked_from=str(r["forked_from"]) if r["forked_from"] else None,
            comment_count=int(r["comment_count"]),
            feedback=ThreadFeedbackOut(
                thumbs_up=up_map.get(str(r["id"]), 0),
                thumbs_down=down_map.get(str(r["id"]), 0),
                needs_attention=(
                    down_map.get(str(r["id"]), 0) > up_map.get(str(r["id"]), 0)
                    and "Discussed in class" not in (r["professor_labels"] or [])
                ),
            ),
            my_feedback=my_feedback_map.get(str(r["id"])),
            student_display_name=anon_map.get(str(r["student_id"]), "Student"),
            is_mine=str(r["student_id"]) == current_user_id,
        )
        for r in thread_rows
    ]


# ---------------------------------------------------------------------------
# POST /api/student/courses/join  — join a course by invite code
# ---------------------------------------------------------------------------

@router.post("/courses/join", response_model=CourseOut)
async def join_course_by_code(
    body: JoinCourseRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    course = await db.fetchrow(
        """
        SELECT c.id, c.name, c.description, c.invite_code, u.display_name AS professor_name,
               COUNT(s.id) AS session_count
        FROM courses c
        JOIN users u ON c.professor_id = u.id
        LEFT JOIN sessions s ON s.course_id = c.id
        WHERE LOWER(c.invite_code) = LOWER($1)
        GROUP BY c.id, c.name, c.description, c.invite_code, u.display_name
        """,
        body.invite_code,
    )
    if not course:
        raise HTTPException(status_code=404, detail="Invalid course code")

    already = await db.fetchval(
        "SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        course["id"], current_user["id"],
    )
    if already:
        raise HTTPException(status_code=409, detail="Already enrolled in this course")

    await db.execute(
        "INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)",
        course["id"], current_user["id"],
    )
    return CourseOut(
        id=str(course["id"]),
        name=course["name"],
        description=course["description"],
        professor_name=course["professor_name"],
        session_count=course["session_count"],
    )


# ---------------------------------------------------------------------------
# GET /api/student/courses/{course_id}/classmates
# ---------------------------------------------------------------------------

@router.get("/courses/{course_id}/classmates", response_model=list[ClassmateOut])
async def get_classmates(
    course_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    enrolled = await db.fetchval(
        "SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        course_id, current_user["id"],
    )
    if not enrolled:
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    rows = await db.fetch(
        """
        SELECT u.id, u.display_name, u.role
        FROM users u
        JOIN course_enrollments ce ON u.id = ce.student_id
        WHERE ce.course_id = $1
        UNION
        SELECT u.id, u.display_name, u.role
        FROM users u
        JOIN courses c ON c.professor_id = u.id
        WHERE c.id = $1
        ORDER BY display_name
        """,
        course_id,
    )
    return [ClassmateOut(id=str(r["id"]), display_name=r["display_name"], role=r["role"]) for r in rows]

