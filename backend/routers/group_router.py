"""Study group API — self-serve student-created groups.

A study group is a `courses` row with course_type='study_group' paired 1:1
with a `study_groups` row (owner_id, no professor). Membership is
`course_enrollments`, the same table institutional courses use. Exactly one
perpetual `sessions` row backs the group's conversation — internal only,
never exposed as "session" in this router's responses.
"""

import asyncio
import secrets

import asyncpg
import tempfile
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from auth import get_current_user
from database import get_db
from routers.student_router import _assert_question_quota
from models import (
    AnswerOut,
    AskGroupQuestionRequest,
    CitationOut,
    CreateGroupRequest,
    ForkRequest,
    DocumentOut,
    GroupDetailOut,
    GroupMemberOut,
    GroupOut,
    GroupQuestionOut,
    JoinGroupResponse,
)
from services import rag_service
from services.document_service import process_text_document
from services.file_extractor import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, extract_text_from_file
from services.storage_service import upload_file

router = APIRouter(prefix="/api/student/groups", tags=["groups"])


def _require_student(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students only")
    return current_user


async def _assert_member(db, course_id: str, user_id: str) -> None:
    # 404 rather than 403 so a non-member can't confirm a group id exists.
    is_member = await db.fetchval(
        "SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        course_id, user_id,
    )
    if not is_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")


async def _resolve_group(db, group_id: str) -> dict:
    row = await db.fetchrow(
        """
        SELECT sg.course_id, s.id AS conversation_id
        FROM study_groups sg
        JOIN sessions s ON s.course_id = sg.course_id
        WHERE sg.id = $1
        """,
        group_id,
    )
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return {"course_id": str(row["course_id"]), "conversation_id": str(row["conversation_id"])}


_GROUP_SELECT = """
    SELECT sg.id AS group_id, c.name, c.description, c.invite_code,
           sg.owner_id, u.display_name AS owner_name,
           s.id AS conversation_id,
           (SELECT COUNT(*) FROM course_enrollments ce WHERE ce.course_id = c.id) AS member_count
    FROM study_groups sg
    JOIN courses c ON c.id = sg.course_id
    JOIN users u ON u.id = sg.owner_id
    JOIN sessions s ON s.course_id = c.id
"""


def _group_out(row) -> GroupOut:
    return GroupOut(
        id=str(row["group_id"]),
        name=row["name"],
        subject=row["description"],
        owner_id=str(row["owner_id"]),
        owner_name=row["owner_name"],
        join_code=row["invite_code"],
        member_count=int(row["member_count"]),
        conversation_id=str(row["conversation_id"]),
    )


# ---------------------------------------------------------------------------
# POST /api/student/groups
# ---------------------------------------------------------------------------

@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(
    body: CreateGroupRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    async with db.transaction():
        # courses.invite_code is UNIQUE; 32 bits of entropy makes a collision
        # rare but not impossible, so retry rather than surface a 500.
        for attempt in range(5):
            join_code = secrets.token_hex(4)
            try:
                course_row = await db.fetchrow(
                    """
                    INSERT INTO courses (professor_id, name, description, course_type, invite_code)
                    VALUES (NULL, $1, $2, 'study_group', $3)
                    RETURNING id
                    """,
                    body.name, body.subject, join_code,
                )
                break
            except asyncpg.UniqueViolationError:
                if attempt == 4:
                    raise HTTPException(
                        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                        detail="Could not allocate a join code, please try again",
                    )
        course_id = str(course_row["id"])

        await db.execute(
            "INSERT INTO study_groups (course_id, owner_id) VALUES ($1, $2)",
            course_id, current_user["id"],
        )
        await db.execute(
            """
            INSERT INTO sessions (course_id, title, status, started_at)
            VALUES ($1, $2, 'active', now())
            """,
            course_id, body.name,
        )
        await db.execute(
            "INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)",
            course_id, current_user["id"],
        )

    row = await db.fetchrow(_GROUP_SELECT + " WHERE c.id = $1", course_id)
    return _group_out(row)


# ---------------------------------------------------------------------------
# GET /api/student/groups
# ---------------------------------------------------------------------------

@router.get("", response_model=list[GroupOut])
async def list_my_groups(
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    rows = await db.fetch(
        _GROUP_SELECT + """
        JOIN course_enrollments ce ON ce.course_id = c.id
        WHERE ce.student_id = $1
        ORDER BY sg.created_at DESC
        """,
        current_user["id"],
    )
    return [_group_out(r) for r in rows]


# ---------------------------------------------------------------------------
# POST /api/student/groups/join/{join_code}
# ---------------------------------------------------------------------------

@router.post("/join/{join_code}", response_model=JoinGroupResponse)
async def join_group(
    join_code: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    course_row = await db.fetchrow(
        "SELECT id FROM courses WHERE LOWER(invite_code) = LOWER($1) AND course_type = 'study_group'",
        join_code,
    )
    if not course_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid group code")
    course_id = str(course_row["id"])

    already_member = bool(await db.fetchval(
        "SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        course_id, current_user["id"],
    ))
    if not already_member:
        await db.execute(
            """
            INSERT INTO course_enrollments (course_id, student_id)
            VALUES ($1, $2)
            ON CONFLICT (course_id, student_id) DO NOTHING
            """,
            course_id, current_user["id"],
        )

    row = await db.fetchrow(_GROUP_SELECT + " WHERE c.id = $1", course_id)
    return JoinGroupResponse(group=_group_out(row), already_member=already_member)


# ---------------------------------------------------------------------------
# GET /api/student/groups/{group_id}
# ---------------------------------------------------------------------------

@router.get("/{group_id}", response_model=GroupDetailOut)
async def get_group_detail(
    group_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    group = await _resolve_group(db, group_id)
    await _assert_member(db, group["course_id"], current_user["id"])

    row = await db.fetchrow(_GROUP_SELECT + " WHERE sg.id = $1", group_id)
    member_rows = await db.fetch(
        """
        SELECT u.id, u.display_name, (u.id = $2) AS is_owner
        FROM course_enrollments ce
        JOIN users u ON u.id = ce.student_id
        WHERE ce.course_id = $1
        ORDER BY is_owner DESC, u.display_name ASC
        """,
        group["course_id"], row["owner_id"],
    )

    stats = await db.fetchrow(
        """
        SELECT COUNT(*) FILTER (WHERE visibility = 'group') AS question_count,
               COUNT(DISTINCT student_id) FILTER (WHERE asked_at > now() - interval '24 hours') AS active_today
        FROM questions WHERE session_id = $1
        """,
        group["conversation_id"],
    )

    return GroupDetailOut(
        id=str(row["group_id"]),
        name=row["name"],
        subject=row["description"],
        join_code=row["invite_code"],
        conversation_id=str(row["conversation_id"]),
        members=[
            GroupMemberOut(id=str(m["id"]), display_name=m["display_name"], is_owner=m["is_owner"])
            for m in member_rows
        ],
        question_count=int(stats["question_count"]),
        active_today=int(stats["active_today"]),
    )


# ---------------------------------------------------------------------------
# GET /api/student/groups/{group_id}/questions
# The whole group sees every question — unlike institutional sessions, where
# GET /sessions/{id}/questions is scoped to the asking student.
# ---------------------------------------------------------------------------

@router.get("/{group_id}/questions", response_model=list[GroupQuestionOut])
async def list_group_questions(
    group_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    group = await _resolve_group(db, group_id)
    await _assert_member(db, group["course_id"], current_user["id"])

    rows = await db.fetch(
        """
        SELECT q.id AS question_id, q.content AS question_content, q.asked_at,
               q.student_id, q.anonymous, u.display_name, q.forked_from,
               q.focus_document_id, fd.filename AS focus_document_name,
               a.id AS answer_id, a.content AS answer_content,
               a.model_used, a.generation_latency_ms,
               (SELECT COUNT(*) FROM question_comments qc WHERE qc.question_id = q.id) AS comment_count
        FROM questions q
        JOIN users u ON u.id = q.student_id
        LEFT JOIN answers a ON a.question_id = q.id
        LEFT JOIN documents fd ON fd.id = q.focus_document_id
        WHERE q.session_id = $1 AND q.visibility = 'group'
        ORDER BY q.asked_at ASC
        """,
        group["conversation_id"],
    )

    answer_ids = [r["answer_id"] for r in rows if r["answer_id"]]
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
            citations_by_answer.setdefault(str(cr["answer_id"]), []).append(CitationOut(
                chunk_id=str(cr["chunk_id"]),
                content=cr["content"],
                page_number=cr["page_number"],
                relevance_score=cr["relevance_score"],
                citation_order=cr["citation_order"],
                filename=cr["filename"],
                document_id=str(cr["document_id"]),
            ))

    results = []
    for r in rows:
        answer = None
        if r["answer_id"]:
            answer = AnswerOut(
                answer_id=str(r["answer_id"]),
                content=r["answer_content"],
                model_used=r["model_used"],
                generation_latency_ms=r["generation_latency_ms"],
                citations=citations_by_answer.get(str(r["answer_id"]), []),
            )
        is_mine = str(r["student_id"]) == str(current_user["id"])
        results.append(GroupQuestionOut(
            question_id=str(r["question_id"]),
            content=r["question_content"],
            asked_at=r["asked_at"],
            student_id=str(r["student_id"]),
            anonymous=r["anonymous"],
            answer=answer,
            asker_name="Anonymous" if (r["anonymous"] and not is_mine) else r["display_name"],
            is_mine=is_mine,
            comment_count=int(r["comment_count"]),
            forked_from=str(r["forked_from"]) if r["forked_from"] else None,
            focus_document_id=str(r["focus_document_id"]) if r["focus_document_id"] else None,
            focus_document_name=r["focus_document_name"],
        ))
    return results


# ---------------------------------------------------------------------------
# POST /api/student/groups/{group_id}/questions
# ---------------------------------------------------------------------------

@router.post("/{group_id}/questions", response_model=GroupQuestionOut, status_code=status.HTTP_201_CREATED)
async def ask_group_question(
    group_id: str,
    body: AskGroupQuestionRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    group = await _resolve_group(db, group_id)
    await _assert_member(db, group["course_id"], current_user["id"])

    focus_name = None
    if body.focus_document_id:
        focus_name = await db.fetchval(
            "SELECT filename FROM documents WHERE id = $1 AND course_id = $2",
            body.focus_document_id, group["course_id"],
        )
        if not focus_name:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="That material isn't in this group")

    await _assert_question_quota(db, group["conversation_id"], str(current_user["id"]))

    result = await rag_service.handle_question(
        session_id=group["conversation_id"],
        student_id=str(current_user["id"]),
        content=body.content,
        db=db,
        anonymous=body.anonymous,
        focus_document_id=body.focus_document_id,
    )
    return GroupQuestionOut(
        **result.model_dump(),
        asker_name=current_user["display_name"],
        is_mine=True,
        comment_count=0,
        focus_document_id=body.focus_document_id,
        focus_document_name=focus_name,
    )


# ---------------------------------------------------------------------------
# POST /api/student/groups/{group_id}/questions/{question_id}/fork
# A private exploration: same conversation (so RAG uses the group's
# materials) but hidden from the feed. Lives in My Chats until shared back.
# ---------------------------------------------------------------------------

@router.post("/{group_id}/questions/{question_id}/fork", response_model=GroupQuestionOut, status_code=status.HTTP_201_CREATED)
async def fork_group_question_privately(
    group_id: str,
    question_id: str,
    body: ForkRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    group = await _resolve_group(db, group_id)
    await _assert_member(db, group["course_id"], current_user["id"])

    parent = await db.fetchrow(
        "SELECT content, focus_document_id FROM questions WHERE id = $1 AND session_id = $2 AND visibility = 'group'",
        question_id, group["conversation_id"],
    )
    if not parent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    await _assert_question_quota(db, group["conversation_id"], str(current_user["id"]))
    await db.execute("UPDATE questions SET fork_count = COALESCE(fork_count, 0) + 1 WHERE id = $1", question_id)

    parent_context = f'[Forked from: "{parent["content"][:100]}"]\n\n'
    result = await rag_service.handle_question(
        session_id=group["conversation_id"],
        student_id=str(current_user["id"]),
        content=parent_context + body.content,
        db=db,
        visibility="private",
        focus_document_id=str(parent["focus_document_id"]) if parent["focus_document_id"] else None,
    )
    await db.execute("UPDATE questions SET forked_from = $1 WHERE id = $2", question_id, result.question_id)
    return GroupQuestionOut(
        **result.model_dump(),
        asker_name=current_user["display_name"],
        is_mine=True,
        comment_count=0,
        forked_from=question_id,
    )


# ---------------------------------------------------------------------------
# GET /api/student/groups/{group_id}/documents
# ---------------------------------------------------------------------------

@router.get("/{group_id}/documents", response_model=list[DocumentOut])
async def list_group_documents(
    group_id: str,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    group = await _resolve_group(db, group_id)
    await _assert_member(db, group["course_id"], current_user["id"])

    rows = await db.fetch(
        """
        SELECT id, filename, storage_path, page_count, content
        FROM documents
        WHERE course_id = $1
        ORDER BY created_at DESC
        """,
        group["course_id"],
    )
    return [
        DocumentOut(
            id=str(r["id"]),
            filename=r["filename"],
            storage_path=r["storage_path"],
            url="" if r["storage_path"] == "inline" else f"/uploads/{r['storage_path']}",
            page_count=r["page_count"],
            content=r["content"],
        )
        for r in rows
    ]


# ---------------------------------------------------------------------------
# POST /api/student/groups/{group_id}/documents/upload
# ---------------------------------------------------------------------------

@router.post("/{group_id}/documents/upload", response_model=DocumentOut)
async def upload_group_document(
    group_id: str,
    file: UploadFile = File(...),
    title: str = Form(""),
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """Any group member (not just the owner) may upload a document."""
    group = await _resolve_group(db, group_id)
    await _assert_member(db, group["course_id"], current_user["id"])

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
            detail=f"File too large. Max {MAX_FILE_SIZE // (1024 * 1024)} MB",
        )

    doc_title = (title or file.filename or "Untitled").strip()[:200]

    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(content_bytes)
        tmp_path = Path(tmp.name)

    try:
        content = extract_text_from_file(tmp_path, file.filename or "")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    finally:
        tmp_path.unlink(missing_ok=True)

    if len(content.strip()) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not extract enough text from file. Try a different file or paste text instead.",
        )

    storage_path = "inline"
    if ext == ".pdf":
        stored_name = f"{uuid.uuid4().hex}{ext}"
        await asyncio.to_thread(upload_file, stored_name, content_bytes)
        storage_path = stored_name

    row = await db.fetchrow(
        """
        INSERT INTO documents (course_id, uploaded_by, filename, storage_path, processing_status, content)
        VALUES ($1, $2, $3, $4, 'uploaded', $5)
        RETURNING id
        """,
        group["course_id"], current_user["id"], doc_title, storage_path, content,
    )
    doc_id = str(row["id"])

    await process_text_document(db, doc_id, content)

    await db.execute(
        """
        INSERT INTO session_documents (session_id, document_id, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (session_id, document_id) DO UPDATE SET is_active = true
        """,
        group["conversation_id"], doc_id,
    )

    row = await db.fetchrow(
        "SELECT id, filename, storage_path, page_count, content FROM documents WHERE id = $1",
        doc_id,
    )
    return DocumentOut(
        id=str(row["id"]),
        filename=row["filename"],
        storage_path=row["storage_path"],
        url="" if row["storage_path"] == "inline" else f"/uploads/{row['storage_path']}",
        page_count=row["page_count"],
        content=row["content"],
    )
