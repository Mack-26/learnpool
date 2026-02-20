"""Professor API — courses owned by the professor, session management, reports, documents."""

import json
import tempfile
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from auth import get_current_user
from database import get_db
from models import (
    AddDocumentRequest,
    CourseOut,
    CreateScheduleRequest,
    CreateSessionRequest,
    DocumentOut,
    ProfessorReviewRequest,
    SessionDetail,
    SessionReportResponse,
    SessionSummary,
    SessionWithDocuments,
    UpdateSessionStatusRequest,
)
from services.document_service import process_text_document
from services.file_extractor import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, extract_text_from_file
from services.report_service import build_session_report

router = APIRouter(prefix="/api/professor", tags=["professor"])


def _require_professor(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "professor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Professors only")
    return current_user


# ---------------------------------------------------------------------------
# GET /api/professor/courses
# ---------------------------------------------------------------------------

@router.get("/courses", response_model=list[CourseOut])
async def get_professor_courses(
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """List courses owned by the current professor."""
    rows = await db.fetch(
        """
        SELECT c.id, c.name, c.description, u.display_name AS professor_name,
               COUNT(s.id) AS session_count
        FROM courses c
        JOIN users u ON c.professor_id = u.id
        LEFT JOIN sessions s ON s.course_id = c.id
        WHERE c.professor_id = $1
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
# GET /api/professor/courses/{course_id}/sessions
# ---------------------------------------------------------------------------

@router.get("/courses/{course_id}/sessions", response_model=list[SessionSummary])
async def get_professor_sessions(
    course_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """List sessions for a course owned by the professor."""
    owned = await db.fetchval(
        "SELECT 1 FROM courses WHERE id = $1 AND professor_id = $2",
        course_id,
        current_user["id"],
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

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
# GET /api/professor/courses/{course_id}/sessions-with-documents
# ---------------------------------------------------------------------------

@router.get("/courses/{course_id}/sessions-with-documents", response_model=list[SessionWithDocuments])
async def get_sessions_with_documents(
    course_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """List sessions with their attached documents for materials view."""
    owned = await db.fetchval(
        "SELECT 1 FROM courses WHERE id = $1 AND professor_id = $2",
        course_id,
        current_user["id"],
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

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
            ORDER BY d.filename
            """,
            s["id"],
        )
        documents = [
            DocumentOut(
                id=str(r["id"]),
                filename=r["filename"],
                storage_path=r["storage_path"],
                url="" if r["storage_path"] == "inline" else f"/uploads/{r['storage_path']}",
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
# POST /api/professor/courses/{course_id}/sessions
# ---------------------------------------------------------------------------

@router.post("/courses/{course_id}/sessions", response_model=SessionSummary)
async def create_session(
    course_id: str,
    body: CreateSessionRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Create a session. Use scheduled=True for future lectures (status=upcoming)."""
    owned = await db.fetchval(
        "SELECT 1 FROM courses WHERE id = $1 AND professor_id = $2",
        course_id,
        current_user["id"],
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    status_val = "upcoming" if body.scheduled else "active"
    row = await db.fetchrow(
        """
        INSERT INTO sessions (course_id, title, status, started_at)
        VALUES ($1, $2, $3, now())
        RETURNING id, title, status, started_at
        """,
        course_id,
        body.title,
        status_val,
    )
    return SessionSummary(
        id=str(row["id"]),
        title=row["title"],
        status=row["status"],
        started_at=row["started_at"],
    )


# ---------------------------------------------------------------------------
# POST /api/professor/courses/{course_id}/schedule
# ---------------------------------------------------------------------------

@router.post("/courses/{course_id}/schedule", response_model=SessionSummary)
async def create_scheduled_lecture(
    course_id: str,
    body: CreateScheduleRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Create a scheduled lecture with date, time, location, and documents."""
    owned = await db.fetchval(
        "SELECT 1 FROM courses WHERE id = $1 AND professor_id = $2",
        course_id,
        current_user["id"],
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    # Parse date + time into scheduled_at (normalize "9:30" -> "09:30")
    from datetime import datetime
    parts = body.scheduled_time.split(":")
    if len(parts) == 2:
        h, m = parts[0].zfill(2), parts[1].zfill(2)
        time_str = f"{h}:{m}"
    else:
        time_str = body.scheduled_time
    try:
        dt = datetime.strptime(f"{body.scheduled_date} {time_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date or time format")

    loc = body.location.strip() or None
    row = await db.fetchrow(
        """
        INSERT INTO sessions (course_id, title, status, started_at, scheduled_at, location)
        VALUES ($1, $2, 'upcoming', $3, $3, $4)
        RETURNING id, title, status, started_at
        """,
        course_id,
        body.title,
        dt,
        loc,
    )
    session_id = str(row["id"])

    # Link documents
    for doc_id in body.document_ids:
        doc_owned = await db.fetchval(
            "SELECT 1 FROM documents WHERE id = $1 AND course_id = $2",
            doc_id,
            course_id,
        )
        if doc_owned:
            await db.execute(
                """
                INSERT INTO session_documents (session_id, document_id, is_active)
                VALUES ($1, $2, true)
                ON CONFLICT (session_id, document_id) DO UPDATE SET is_active = true
                """,
                session_id,
                doc_id,
            )

    return SessionSummary(
        id=session_id,
        title=row["title"],
        status=row["status"],
        started_at=row["started_at"],
    )


# ---------------------------------------------------------------------------
# PATCH /api/professor/sessions/{session_id}/status
# ---------------------------------------------------------------------------

@router.patch("/sessions/{session_id}/status", response_model=SessionSummary)
async def update_session_status(
    session_id: str,
    body: UpdateSessionStatusRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Update session status (active, ended, released)."""
    owned = await db.fetchval(
        """
        SELECT 1 FROM sessions s
        JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

    if body.status == "ended":
        await db.execute(
            "UPDATE sessions SET status = $1, ended_at = now() WHERE id = $2",
            body.status,
            session_id,
        )
    else:
        await db.execute(
            "UPDATE sessions SET status = $1 WHERE id = $2",
            body.status,
            session_id,
        )

    row = await db.fetchrow(
        "SELECT id, title, status, started_at FROM sessions WHERE id = $1",
        session_id,
    )
    return SessionSummary(
        id=str(row["id"]),
        title=row["title"],
        status=row["status"],
        started_at=row["started_at"],
    )


# ---------------------------------------------------------------------------
# GET /api/professor/sessions/{session_id}
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session_detail(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Get session details for editing. Only upcoming sessions are editable."""
    row = await db.fetchrow(
        """
        SELECT s.id, s.title, s.status, s.started_at, s.scheduled_at, s.location
        FROM sessions s
        JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    doc_rows = await db.fetch(
        "SELECT document_id FROM session_documents WHERE session_id = $1 AND is_active = true",
        session_id,
    )
    document_ids = [str(r["document_id"]) for r in doc_rows]

    scheduled_at = row.get("scheduled_at") or row["started_at"]
    return SessionDetail(
        id=str(row["id"]),
        title=row["title"],
        status=row["status"],
        started_at=row["started_at"],
        scheduled_at=scheduled_at,
        location=row.get("location"),
        document_ids=document_ids,
    )


# ---------------------------------------------------------------------------
# PATCH /api/professor/sessions/{session_id}
# ---------------------------------------------------------------------------

@router.patch("/sessions/{session_id}", response_model=SessionSummary)
async def update_session(
    session_id: str,
    body: CreateScheduleRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Update a scheduled (upcoming) lecture. Only upcoming sessions can be edited."""
    row = await db.fetchrow(
        """
        SELECT s.id, s.status FROM sessions s
        JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if row["status"] != "upcoming":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only scheduled (upcoming) lectures can be edited",
        )

    from datetime import datetime
    parts = body.scheduled_time.split(":")
    time_str = f"{parts[0].zfill(2)}:{parts[1].zfill(2)}" if len(parts) == 2 else body.scheduled_time
    try:
        dt = datetime.strptime(f"{body.scheduled_date} {time_str}", "%Y-%m-%d %H:%M")
    except ValueError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid date or time format")

    loc = body.location.strip() or None
    await db.execute(
        """
        UPDATE sessions SET title = $1, started_at = $2, scheduled_at = $2, location = $3
        WHERE id = $4
        """,
        body.title,
        dt,
        loc,
        session_id,
    )

    # Update document links: clear and re-link
    await db.execute(
        "DELETE FROM session_documents WHERE session_id = $1",
        session_id,
    )
    course_id = await db.fetchval("SELECT course_id FROM sessions WHERE id = $1", session_id)
    for doc_id in body.document_ids:
        doc_owned = await db.fetchval(
            "SELECT 1 FROM documents WHERE id = $1 AND course_id = $2",
            doc_id,
            course_id,
        )
        if doc_owned:
            await db.execute(
                """
                INSERT INTO session_documents (session_id, document_id, is_active)
                VALUES ($1, $2, true)
                """,
                session_id,
                doc_id,
            )

    row = await db.fetchrow(
        "SELECT id, title, status, started_at FROM sessions WHERE id = $1",
        session_id,
    )
    return SessionSummary(
        id=str(row["id"]),
        title=row["title"],
        status=row["status"],
        started_at=row["started_at"],
    )


# ---------------------------------------------------------------------------
# DELETE /api/professor/sessions/{session_id}
# ---------------------------------------------------------------------------

@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Delete a scheduled (upcoming) lecture. Only upcoming sessions can be deleted."""
    row = await db.fetchrow(
        """
        SELECT s.id, s.status FROM sessions s
        JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    if row["status"] != "upcoming":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only scheduled (upcoming) lectures can be deleted",
        )

    await db.execute("DELETE FROM sessions WHERE id = $1", session_id)


# ---------------------------------------------------------------------------
# GET /api/professor/sessions/{session_id}/report
# ---------------------------------------------------------------------------

@router.get("/sessions/{session_id}/report", response_model=SessionReportResponse)
async def get_professor_session_report(
    session_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Get anonymised Q&A report for a session. Professor must own the course."""
    owned = await db.fetchval(
        """
        SELECT 1 FROM sessions s
        JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
        WHERE s.id = $2
        """,
        current_user["id"],
        session_id,
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your session")

    return await build_session_report(db, session_id, published_only=True, include_review_data=True)


# ---------------------------------------------------------------------------
# PATCH /api/professor/questions/{question_id}
# ---------------------------------------------------------------------------

@router.patch("/questions/{question_id}")
async def update_question_review(
    question_id: str,
    body: ProfessorReviewRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """Update professor labels and notes on a question. Professor must own the course."""
    owned = await db.fetchval(
        """
        SELECT 1 FROM questions q
        JOIN sessions s ON s.id = q.session_id
        JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
        WHERE q.id = $2
        """,
        current_user["id"],
        question_id,
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your question")

    row = await db.fetchrow(
        """
        UPDATE questions
           SET professor_labels = $1, professor_notes = $2
         WHERE id = $3
         RETURNING id
        """,
        body.labels,
        body.notes,
        question_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    return {"question_id": str(row["id"])}


# ---------------------------------------------------------------------------
# GET /api/professor/courses/{course_id}/documents
# ---------------------------------------------------------------------------

@router.get("/courses/{course_id}/documents", response_model=list[DocumentOut])
async def get_course_documents(
    course_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """List all documents for a course (for professor to manage)."""
    owned = await db.fetchval(
        "SELECT 1 FROM courses WHERE id = $1 AND professor_id = $2",
        course_id,
        current_user["id"],
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    rows = await db.fetch(
        """
        SELECT id, filename, storage_path, page_count, content
        FROM documents
        WHERE course_id = $1
        ORDER BY created_at DESC
        """,
        course_id,
    )
    return [
        DocumentOut(
            id=str(r["id"]),
            filename=r["filename"],
            storage_path=r["storage_path"],
            url="" if r["storage_path"] == "inline" else f"/uploads/{r['storage_path']}",
            page_count=r["page_count"],
            content=r.get("content"),
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# POST /api/professor/courses/{course_id}/documents
# ---------------------------------------------------------------------------

@router.post("/courses/{course_id}/documents", response_model=DocumentOut)
async def add_document(
    course_id: str,
    body: AddDocumentRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """
    Add lecture material as text. Creates document, chunks it, embeds, and links to sessions.
    Shared with students immediately once processing completes.
    """
    owned = await db.fetchval(
        "SELECT 1 FROM courses WHERE id = $1 AND professor_id = $2",
        course_id,
        current_user["id"],
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    # Verify professor owns all sessions
    for sid in body.session_ids:
        session_owned = await db.fetchval(
            """
            SELECT 1 FROM sessions s
            JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
            WHERE s.id = $2
            """,
            current_user["id"],
            sid,
        )
        if not session_owned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Session {sid} is not in your course",
            )

    # Create document (inline text)
    row = await db.fetchrow(
        """
        INSERT INTO documents (course_id, uploaded_by, filename, storage_path, processing_status, content)
        VALUES ($1, $2, $3, 'inline', 'uploaded', $4)
        RETURNING id, filename, storage_path, page_count, content
        """,
        course_id,
        current_user["id"],
        body.title,
        body.content,
    )
    doc_id = str(row["id"])

    # Process: chunk + embed
    await process_text_document(db, doc_id, body.content)

    # Link to sessions
    for sid in body.session_ids:
        await db.execute(
            """
            INSERT INTO session_documents (session_id, document_id, is_active)
            VALUES ($1, $2, true)
            ON CONFLICT (session_id, document_id) DO UPDATE SET is_active = true
            """,
            sid,
            doc_id,
        )

    # Fetch updated row (processing_status = ready now)
    row = await db.fetchrow(
        "SELECT id, filename, storage_path, page_count, content FROM documents WHERE id = $1",
        doc_id,
    )
    url = "" if row["storage_path"] == "inline" else f"/uploads/{row['storage_path']}"
    return DocumentOut(
        id=str(row["id"]),
        filename=row["filename"],
        storage_path=row["storage_path"],
        url=url,
        page_count=row["page_count"],
        content=row.get("content"),
    )


# ---------------------------------------------------------------------------
# POST /api/professor/courses/{course_id}/documents/upload
# ---------------------------------------------------------------------------

@router.post("/courses/{course_id}/documents/upload", response_model=DocumentOut)
async def upload_document(
    course_id: str,
    file: UploadFile = File(...),
    title: str = Form(""),
    session_ids: str = Form(...),
    db=Depends(get_db),
    current_user: dict = Depends(_require_professor),
):
    """
    Upload a file (PDF, TXT, DOCX). Extracts text, chunks, embeds, and links to lectures.
    """
    owned = await db.fetchval(
        "SELECT 1 FROM courses WHERE id = $1 AND professor_id = $2",
        course_id,
        current_user["id"],
    )
    if not owned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your course")

    try:
        session_id_list = json.loads(session_ids)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid session_ids")

    if not session_id_list:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select at least one lecture")

    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Use: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    content_bytes = await file.read()
    if len(content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max {MAX_FILE_SIZE // (1024*1024)} MB",
        )

    for sid in session_id_list:
        session_owned = await db.fetchval(
            """
            SELECT 1 FROM sessions s
            JOIN courses c ON c.id = s.course_id AND c.professor_id = $1
            WHERE s.id = $2
            """,
            current_user["id"],
            sid,
        )
        if not session_owned:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Lecture {sid} is not in your course",
            )

    doc_title = (title or file.filename or "Untitled").strip()[:200]

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content_bytes)
        tmp_path = Path(tmp.name)

    try:
        content = extract_text_from_file(tmp_path, file.filename or "")
    except ValueError as e:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    if len(content.strip()) < 10:
        tmp_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract enough text from file. Try a different file or paste text instead.",
        )

    # For PDFs: save file to uploads for preview; use inline for TXT/DOCX
    import uuid
    uploads_dir = Path(__file__).resolve().parent.parent / "uploads"
    uploads_dir.mkdir(exist_ok=True)
    storage_path = "inline"
    if ext == ".pdf":
        stored_name = f"{uuid.uuid4().hex}{ext}"
        stored_path = uploads_dir / stored_name
        stored_path.write_bytes(content_bytes)
        storage_path = stored_name

    tmp_path.unlink(missing_ok=True)

    row = await db.fetchrow(
        """
        INSERT INTO documents (course_id, uploaded_by, filename, storage_path, processing_status, content)
        VALUES ($1, $2, $3, $4, 'uploaded', $5)
        RETURNING id, filename, storage_path, page_count, content
        """,
        course_id,
        current_user["id"],
        doc_title,
        storage_path,
        content,
    )
    doc_id = str(row["id"])

    await process_text_document(db, doc_id, content)

    for sid in session_id_list:
        await db.execute(
            """
            INSERT INTO session_documents (session_id, document_id, is_active)
            VALUES ($1, $2, true)
            ON CONFLICT (session_id, document_id) DO UPDATE SET is_active = true
            """,
            sid,
            doc_id,
        )

    row = await db.fetchrow(
        "SELECT id, filename, storage_path, page_count, content FROM documents WHERE id = $1",
        doc_id,
    )
    url = "" if row["storage_path"] == "inline" else f"/uploads/{row['storage_path']}"
    return DocumentOut(
        id=str(row["id"]),
        filename=row["filename"],
        storage_path=row["storage_path"],
        url=url,
        page_count=row["page_count"],
        content=row.get("content"),
    )
