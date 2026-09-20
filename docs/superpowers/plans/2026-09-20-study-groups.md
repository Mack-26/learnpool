# Study Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any student create a self-serve "study group" (join link, any-member material upload, continuous AI+peer conversation), while institutional courses are completely unaffected.

**Architecture:** Extend the existing `courses`/`sessions` schema rather than building a parallel system. A study group is a `courses` row with `course_type='study_group'` and `professor_id=NULL`, paired 1:1 with a new `study_groups` row holding `owner_id`. Membership reuses the existing `course_enrollments` table. Exactly one perpetual `sessions` row (status stuck at `'active'`) backs the group's conversation, so the existing question/answer/RAG/comment/vote/fork/thread machinery works unmodified. "Session" never appears in group-facing API fields or UI copy.

**Tech Stack:** FastAPI + asyncpg (backend), React + TypeScript + Vite + TanStack Query + Tailwind (frontend). No automated test framework exists in this repo (`backend/requirements.txt` has no pytest, no `tests/` directory) — verification in this plan follows the project's existing convention of manual `curl` calls against the local dev stack (see `CLAUDE.md`'s documented seed IDs / curl-test pattern), not new pytest infrastructure.

**Spec:** `docs/superpowers/specs/2026-09-20-study-groups-design.md`

## Global Constraints

- `professor_id` is never set to a student's user id; it is `NULL` for `study_group` courses.
- `study_groups.owner_id` is the authoritative owner reference.
- `course_enrollments` remains the sole membership/authorization table — no parallel membership table.
- One persistent internal `sessions` row per group is acceptable; the word "session" must never appear in group-facing API response field names, error messages, or UI copy (use "conversation").
- Reuse `courses.invite_code` (already exists, `TEXT UNIQUE NOT NULL`, migration `007_invite_codes.sql`, generated via `secrets.token_hex(4)` in `professor_router.py`) for the group join code — do not add a second join-code column.
- Every group-scoped read must check `course_enrollments` membership *before* returning any data, and return `404` (not `403`) on failure, to prevent group-id enumeration.
- The join endpoint must be idempotent: joining twice never errors; it returns the group with `already_member: true`.
- Institutional course/session lifecycle endpoints and behavior must not change.
- Home page is capped at exactly three sections for this pass: continue studying, recent activity, your groups list. No other widgets.

---

## File Structure

**Backend — new files:**
- `db/migrations/010_study_groups.sql` — schema migration.
- `backend/routers/group_router.py` — all group endpoints.

**Backend — modified files:**
- `backend/models.py` — add group Pydantic models, add `origin_group_name` to `RichThreadOut`.
- `backend/main.py` — mount `group_router`.
- `backend/routers/student_router.py` — enrich `_fetch_rich_threads` with group provenance; add `GET /api/student/home`.
- `backend/routers/professor_router.py` — guard session-lifecycle endpoints against `study_group` courses.

**Frontend — new files:**
- `frontend/src/api/groups.ts` — API client functions for groups.
- `frontend/src/components/CreateGroupModal.tsx`
- `frontend/src/components/JoinGroupModal.tsx`
- `frontend/src/pages/GroupWorkspacePage.tsx` — Discord-style sidebar + conversation + members.
- `frontend/src/pages/HomePage.tsx` — the three-section Home page.

**Frontend — modified files:**
- `frontend/src/types/api.ts` — add group types, `origin_group_name` on `RichThreadOut`.
- `frontend/src/App.tsx` — add routes.

---

### Task 1: Migration — study group schema

**Files:**
- Create: `db/migrations/010_study_groups.sql`

**Interfaces:**
- Produces: `courses.course_type` (`'institutional'|'study_group'`, default `'institutional'`), `courses.professor_id` now nullable, `study_groups(id, course_id, owner_id, created_at)` table.

- [ ] **Step 1: Write the migration file**

```sql
-- =============================================================================
-- Migration 010: Study Groups
-- Apply: make db-shell → \i /docker-entrypoint-initdb.d/010_study_groups.sql
-- =============================================================================

CREATE TYPE course_type AS ENUM ('institutional', 'study_group');
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type course_type NOT NULL DEFAULT 'institutional';
ALTER TABLE courses ALTER COLUMN professor_id DROP NOT NULL;

CREATE TABLE IF NOT EXISTS study_groups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
    owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_groups_owner ON study_groups (owner_id);
```

- [ ] **Step 2: Apply it to the running local DB**

Run:
```bash
make db-shell
```
Then inside psql:
```
\i /docker-entrypoint-initdb.d/010_study_groups.sql
```

- [ ] **Step 3: Verify**

Run inside psql:
```sql
\d courses
\d study_groups
```
Expected: `courses` shows `course_type course_type NOT NULL DEFAULT 'institutional'::course_type` and `professor_id` with no `not null`; `study_groups` table exists with the four columns above. Exit psql with `\q`.

- [ ] **Step 4: Commit**

```bash
git add db/migrations/010_study_groups.sql
git commit -m "$(cat <<'EOF'
db: add study_groups table and course_type discriminator

Enables self-serve student-created groups without conflating group
ownership with the professor role. professor_id stays NULL for
study_group courses; study_groups.owner_id is authoritative.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Pydantic models for groups

**Files:**
- Modify: `backend/models.py` (append near the end of the file, after existing thread/comment models)

**Interfaces:**
- Produces: `CreateGroupRequest`, `GroupOut`, `GroupMemberOut`, `GroupDetailOut`, `JoinGroupResponse` — consumed by `group_router.py` (Task 3, 4) and `RichThreadOut.origin_group_name` (Task 6).

- [ ] **Step 1: Add the models**

```python
class CreateGroupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    subject: str | None = Field(default=None, max_length=200)


class GroupOut(BaseModel):
    id: str
    name: str
    subject: str | None
    owner_id: str
    owner_name: str
    join_code: str
    member_count: int
    conversation_id: str  # internal sessions.id — never call this "session" in responses


class GroupMemberOut(BaseModel):
    id: str
    display_name: str
    is_owner: bool


class GroupDetailOut(BaseModel):
    id: str
    name: str
    subject: str | None
    join_code: str
    conversation_id: str
    members: list[GroupMemberOut]


class JoinGroupResponse(BaseModel):
    group: GroupOut
    already_member: bool
```

- [ ] **Step 2: Add `origin_group_name` to the existing `RichThreadOut` model**

Find the `class RichThreadOut(BaseModel):` block (currently ends with `is_mine: bool` per the existing frontend type mirror) and add one field:

```python
class RichThreadOut(BaseModel):
    thread_id: str
    title: str | None
    exchange_count: int
    shared_at: datetime
    exchanges: list["RichThreadExchange"]
    include_questions: bool
    professor_labels: list[str]
    professor_notes: str | None
    fork_count: int
    forked_from: str | None
    comment_count: int
    feedback: "ThreadFeedbackOut | None"
    my_feedback: str | None
    student_display_name: str
    is_mine: bool
    origin_group_name: str | None = None
```

(Only add the new `origin_group_name: str | None = None` line — do not otherwise restructure the existing class; match whatever field order/types are already there.)

- [ ] **Step 3: Verify it imports cleanly**

Run:
```bash
cd backend && source venv/bin/activate && python -c "import models; print(models.GroupOut, models.JoinGroupResponse)"
```
Expected: prints the two classes with no `ImportError`/`NameError`.

- [ ] **Step 4: Commit**

```bash
git add backend/models.py
git commit -m "$(cat <<'EOF'
feat: add Pydantic models for study groups

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Group router — create, list, join, detail

**Files:**
- Create: `backend/routers/group_router.py`
- Modify: `backend/main.py:12-14,37-39` (add import + `include_router`)

**Interfaces:**
- Consumes: `models.CreateGroupRequest`, `models.GroupOut`, `models.GroupDetailOut`, `models.GroupMemberOut`, `models.JoinGroupResponse`; `database.get_db`; `auth.get_current_user`.
- Produces: `POST /api/student/groups`, `GET /api/student/groups`, `POST /api/student/groups/join/{join_code}`, `GET /api/student/groups/{group_id}` — consumed by frontend Task 7.

- [ ] **Step 1: Write `group_router.py`**

```python
"""Study group API — self-serve student-created groups.

A study group is a `courses` row with course_type='study_group' paired
1:1 with a `study_groups` row (owner_id, no professor). Membership is
`course_enrollments`, same table institutional courses use. Exactly one
perpetual `sessions` row backs the group's conversation — internal only,
never exposed as "session" in this router's responses.
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, status

from auth import get_current_user
from database import get_db
from models import CreateGroupRequest, GroupDetailOut, GroupMemberOut, GroupOut, JoinGroupResponse

router = APIRouter(prefix="/api/student/groups", tags=["groups"])


def _require_student(current_user: dict = Depends(get_current_user)) -> dict:
    if current_user["role"] != "student":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Students only")
    return current_user


async def _assert_member(db, course_id: str, user_id: str) -> None:
    """Authorize-before-fetch: raise 404 (not 403) if the user isn't a member,
    so a group id can't be enumerated by a non-member."""
    is_member = await db.fetchval(
        "SELECT 1 FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        course_id, user_id,
    )
    if not is_member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")


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


# ---------------------------------------------------------------------------
# POST /api/student/groups
# ---------------------------------------------------------------------------

@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(
    body: CreateGroupRequest,
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    join_code = secrets.token_hex(4)

    course_row = await db.fetchrow(
        """
        INSERT INTO courses (professor_id, name, description, course_type, invite_code)
        VALUES (NULL, $1, $2, 'study_group', $3)
        RETURNING id
        """,
        body.name, body.subject, join_code,
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
    course_id_row = await db.fetchrow("SELECT course_id FROM study_groups WHERE id = $1", group_id)
    if not course_id_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    course_id = str(course_id_row["course_id"])

    await _assert_member(db, course_id, current_user["id"])

    row = await db.fetchrow(_GROUP_SELECT + " WHERE sg.id = $1", group_id)
    member_rows = await db.fetch(
        """
        SELECT u.id, u.display_name, (u.id = $2) AS is_owner
        FROM course_enrollments ce
        JOIN users u ON u.id = ce.student_id
        WHERE ce.course_id = $1
        ORDER BY is_owner DESC, u.display_name ASC
        """,
        course_id, row["owner_id"],
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
    )
```

- [ ] **Step 2: Mount the router in `main.py`**

In `backend/main.py`, next to the existing router imports (around line 12-14):

```python
from routers.auth_router import router as auth_router
from routers.student_router import router as student_router
from routers.professor_router import router as professor_router
from routers.group_router import router as group_router
```

And next to the existing `include_router` calls (around line 37-39):

```python
app.include_router(auth_router)
app.include_router(student_router)
app.include_router(professor_router)
app.include_router(group_router)
```

- [ ] **Step 3: Start the backend and verify manually with curl**

Run:
```bash
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

In another terminal, log in as a seed student and exercise the flow:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"devpassword"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -X POST http://localhost:8000/api/student/groups \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"EECS 551","subject":"Matrix Methods for ML"}' | python3 -m json.tool
```

Expected: `201` JSON with `id`, `join_code` (8 hex chars), `conversation_id`, `member_count: 1`, `owner_name: "Alice"` (or seed display name).

```bash
GROUP_ID=<id from above>
JOIN_CODE=<join_code from above>

curl -s http://localhost:8000/api/student/groups -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
# Expected: array containing the group just created.

BOB_TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"devpassword"}' | python3 -c "import sys,json;print(json.load(sys.stdin)['access_token'])")

curl -s -X POST http://localhost:8000/api/student/groups/join/$JOIN_CODE \
  -H "Authorization: Bearer $BOB_TOKEN" | python3 -m json.tool
# Expected: 200, "already_member": false, member_count now 2.

curl -s -X POST http://localhost:8000/api/student/groups/join/$JOIN_CODE \
  -H "Authorization: Bearer $BOB_TOKEN" | python3 -m json.tool
# Expected: 200 again (not 409), "already_member": true — idempotency check.

curl -s http://localhost:8000/api/student/groups/$GROUP_ID -H "Authorization: Bearer $BOB_TOKEN" | python3 -m json.tool
# Expected: 200, members array has 2 entries, one with is_owner: true (Alice).

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/student/groups/$GROUP_ID
# Expected: 401 (no token) — confirms auth is required.

CAROL_TOKEN=... # any student not enrolled in this group, or reuse a third seed student if available
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/api/student/groups/$GROUP_ID -H "Authorization: Bearer $CAROL_TOKEN"
# Expected: 404 (not 403) for a non-member — confirms enumeration guard.
```

- [ ] **Step 4: Commit**

```bash
git add backend/routers/group_router.py backend/main.py
git commit -m "$(cat <<'EOF'
feat: add study group create/list/join/detail endpoints

Reuses course_enrollments for membership and courses.invite_code for
the join code. Join is idempotent; group reads are authorize-then-fetch
and return 404 (not 403) to non-members to prevent id enumeration.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Group document upload (any member)

**Files:**
- Modify: `backend/routers/group_router.py` (append new endpoint)

**Interfaces:**
- Consumes: `services.file_extractor.{ALLOWED_EXTENSIONS,MAX_FILE_SIZE,extract_text_from_file}`, `services.document_service.process_text_document(db, doc_id, content)`, `services.storage_service.upload_file`, `models.DocumentOut`.
- Produces: `POST /api/student/groups/{group_id}/documents/upload`.

- [ ] **Step 1: Add imports and the endpoint**

At the top of `group_router.py`, add these imports alongside the existing ones:

```python
import tempfile
import uuid
from pathlib import Path

from fastapi import File, Form, UploadFile

from models import DocumentOut
from services.document_service import process_text_document
from services.file_extractor import ALLOWED_EXTENSIONS, MAX_FILE_SIZE, extract_text_from_file
from services.storage_service import upload_file
```

Then append, at the end of the file:

```python
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
    group_row = await db.fetchrow(
        """
        SELECT sg.course_id, s.id AS conversation_id
        FROM study_groups sg
        JOIN sessions s ON s.course_id = sg.course_id
        WHERE sg.id = $1
        """,
        group_id,
    )
    if not group_row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    course_id = str(group_row["course_id"])
    conversation_id = str(group_row["conversation_id"])

    await _assert_member(db, course_id, current_user["id"])

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

    import asyncio
    storage_path = "inline"
    if ext == ".pdf":
        stored_name = f"{uuid.uuid4().hex}{ext}"
        await asyncio.to_thread(upload_file, stored_name, content_bytes)
        storage_path = stored_name

    tmp_path.unlink(missing_ok=True)

    row = await db.fetchrow(
        """
        INSERT INTO documents (course_id, uploaded_by, filename, storage_path, processing_status, content)
        VALUES ($1, $2, $3, $4, 'uploaded', $5)
        RETURNING id, filename, storage_path, page_count, content
        """,
        course_id, current_user["id"], doc_title, storage_path, content,
    )
    doc_id = str(row["id"])

    await process_text_document(db, doc_id, content)

    await db.execute(
        """
        INSERT INTO session_documents (session_id, document_id, is_active)
        VALUES ($1, $2, true)
        ON CONFLICT (session_id, document_id) DO UPDATE SET is_active = true
        """,
        conversation_id, doc_id,
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
        content=row["content"],
    )
```

- [ ] **Step 2: Verify with curl**

With the backend still running and `TOKEN`/`GROUP_ID` from Task 3:

```bash
echo "SVD is used for dimensionality reduction because it decomposes a matrix into orthogonal components ordered by variance explained." > /tmp/notes.txt

curl -s -X POST http://localhost:8000/api/student/groups/$GROUP_ID/documents/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/notes.txt" -F "title=Lecture notes" | python3 -m json.tool
```
Expected: `200` with `filename: "Lecture notes"` — wait for it to return (embedding runs synchronously inline via `process_text_document`).

Then confirm a member (Bob, from Task 3) can also upload — reuse `$BOB_TOKEN`:
```bash
curl -s -X POST http://localhost:8000/api/student/groups/$GROUP_ID/documents/upload \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -F "file=@/tmp/notes.txt" -F "title=Bob notes" | python3 -m json.tool
```
Expected: `200` — confirms any member, not just the owner, can upload.

- [ ] **Step 3: Commit**

```bash
git add backend/routers/group_router.py
git commit -m "$(cat <<'EOF'
feat: allow any study group member to upload materials

Reuses the existing extraction/chunking/embedding pipeline; auto-links
the upload to the group's single perpetual conversation.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Guard institutional session lifecycle against study groups

**Files:**
- Modify: `backend/routers/professor_router.py` (the session-status endpoint — search for `UpdateSessionStatusRequest` usage / the endpoint that sets `status = 'ended'`/`'released'`)

**Interfaces:**
- Consumes: nothing new.
- Produces: rejects lifecycle transitions on `study_group` courses with `400`.

- [ ] **Step 1: Locate the endpoint**

Run:
```bash
grep -n "UpdateSessionStatusRequest\|def update_session_status\|status IN\|SET status" backend/routers/professor_router.py
```
Find the function that updates `sessions.status` (release/end). Read that function's full body with the Read tool before editing.

- [ ] **Step 2: Add the guard**

At the top of that function, immediately after resolving/validating professor ownership of the session, add:

```python
    course_type_row = await db.fetchval(
        """
        SELECT c.course_type FROM sessions s
        JOIN courses c ON c.id = s.course_id
        WHERE s.id = $1
        """,
        session_id,
    )
    if course_type_row == "study_group":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session lifecycle actions are not applicable to study groups",
        )
```

(Match the exact local variable name for the session id parameter used in that function — it may be named `session_id` already; use whatever the function's actual parameter/variable is.)

- [ ] **Step 3: Verify**

Since a `study_group` course has `professor_id = NULL`, the *existing* ownership check (`WHERE ... professor_id = $current_user_id`) already rejects any professor from touching it — confirm this by re-reading the function's existing ownership query. If the ownership check already makes the new guard unreachable (i.e., no professor can ever own a `study_group` course, so the ownership check alone already returns 403/404 first), state in the commit message that the guard is defense-in-depth for a future world where ownership checks might change, not currently reachable through the professor-authenticated path. Confirm by re-running the Task 3 curl group-creation call and checking `professor_id IS NULL`:

```bash
psql "$(grep DATABASE_URL backend/.env | cut -d= -f2-)" -c \
  "SELECT professor_id, course_type FROM courses WHERE course_type = 'study_group' LIMIT 1;"
```
Expected: `professor_id` is empty/NULL, `course_type` is `study_group`.

- [ ] **Step 4: Commit**

```bash
git add backend/routers/professor_router.py
git commit -m "$(cat <<'EOF'
fix: guard session lifecycle endpoints against study_group courses

Defense-in-depth: study_group courses have professor_id=NULL so the
existing ownership check already excludes them, but this makes the
exclusion explicit rather than incidental.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Thread provenance (origin_group_name) + Home endpoint

**Files:**
- Modify: `backend/routers/student_router.py:1199` (`_fetch_rich_threads`) and append a new `GET /api/student/home` endpoint.

**Interfaces:**
- Consumes: existing `threads`, `sessions`, `courses`, `study_groups` tables; `models.RichThreadOut` (now has `origin_group_name`).
- Produces: `origin_group_name: str | None` on every `RichThreadOut`; `GET /api/student/home`.

- [ ] **Step 1: Add provenance lookup inside `_fetch_rich_threads`**

After the existing block that builds `thread_ids = [str(r["id"]) for r in thread_rows]` (around line 1227), add a batch lookup keyed by each thread's `forked_from` id:

```python
    forked_from_ids = [str(r["forked_from"]) for r in thread_rows if r["forked_from"]]
    origin_group_map: dict[str, str] = {}
    if forked_from_ids:
        origin_rows = await db.fetch(
            """
            SELECT t.id AS origin_thread_id, c.name AS course_name, c.course_type
            FROM threads t
            JOIN sessions s ON s.id = t.session_id
            JOIN courses c ON c.id = s.course_id
            WHERE t.id = ANY($1::uuid[])
            """,
            forked_from_ids,
        )
        origin_group_map = {
            str(r["origin_thread_id"]): r["course_name"]
            for r in origin_rows if r["course_type"] == "study_group"
        }
```

Then in the final `return [RichThreadOut(...) for r in thread_rows]` list construction, add the field, keyed off each row's own `forked_from`:

```python
            origin_group_name=(
                origin_group_map.get(str(r["forked_from"])) if r["forked_from"] else None
            ),
```

Add this as one more keyword argument inside the existing `RichThreadOut(...)` constructor call, alongside `forked_from=...`.

- [ ] **Step 2: Add the Home aggregation endpoint**

Append to `student_router.py`:

```python
# ---------------------------------------------------------------------------
# GET /api/student/home
# ---------------------------------------------------------------------------

@router.get("/home")
async def get_home(
    db=Depends(get_db),
    current_user: dict = Depends(_require_student),
):
    """MVP Home: continue studying, recent activity, your groups. Nothing else."""
    continue_studying = await db.fetch(
        """
        SELECT c.id AS course_id, c.name, c.course_type,
               MAX(q.asked_at) AS last_activity
        FROM course_enrollments ce
        JOIN courses c ON c.id = ce.course_id
        JOIN sessions s ON s.course_id = c.id
        LEFT JOIN questions q ON q.session_id = s.id
        WHERE ce.student_id = $1
        GROUP BY c.id, c.name, c.course_type
        ORDER BY last_activity DESC NULLS LAST
        LIMIT 5
        """,
        current_user["id"],
    )

    recent_activity = await db.fetch(
        """
        SELECT q.id AS question_id, q.content, q.asked_at, c.name AS course_name
        FROM questions q
        JOIN sessions s ON s.id = q.session_id
        JOIN courses c ON c.id = s.course_id
        JOIN course_enrollments ce ON ce.course_id = c.id AND ce.student_id = $1
        ORDER BY q.asked_at DESC
        LIMIT 10
        """,
        current_user["id"],
    )

    groups = await db.fetch(
        """
        SELECT c.id, c.name FROM study_groups sg
        JOIN courses c ON c.id = sg.course_id
        JOIN course_enrollments ce ON ce.course_id = c.id AND ce.student_id = $1
        ORDER BY sg.created_at DESC
        """,
        current_user["id"],
    )

    return {
        "continue_studying": [
            {"course_id": str(r["course_id"]), "name": r["name"], "course_type": r["course_type"]}
            for r in continue_studying
        ],
        "recent_activity": [
            {"question_id": str(r["question_id"]), "content": r["content"],
             "asked_at": r["asked_at"].isoformat(), "course_name": r["course_name"]}
            for r in recent_activity
        ],
        "groups": [{"id": str(r["id"]), "name": r["name"]} for r in groups],
    }
```

- [ ] **Step 3: Verify with curl**

```bash
curl -s http://localhost:8000/api/student/home -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```
Expected: `200` with `continue_studying`, `recent_activity`, `groups` keys; `groups` includes the "EECS 551" group from Task 3.

To verify provenance, fork a shared thread inside the group (requires a question to exist first — see Task 9's manual test for creating one), then re-fetch shared threads for that group's conversation and confirm the forked thread's `origin_group_name` equals the group's name. Use whichever existing shared-threads route the frontend already calls — check `frontend/src/api/sessions.ts` for its exact path before running this.

- [ ] **Step 4: Commit**

```bash
git add backend/routers/student_router.py
git commit -m "$(cat <<'EOF'
feat: thread fork provenance across groups + Home aggregation endpoint

origin_group_name lets the UI show "Forked from <Group> Question #N"
without a schema change, by joining through the existing forked_from
chain. Home endpoint is deliberately capped to three sections per spec.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Frontend types + API client for groups

**Files:**
- Modify: `frontend/src/types/api.ts` (append types, add `origin_group_name` to `RichThreadOut`)
- Create: `frontend/src/api/groups.ts`

**Interfaces:**
- Produces: `GroupOut`, `GroupMemberOut`, `GroupDetailOut`, `JoinGroupResponse` types; `createGroup`, `getMyGroups`, `joinGroup`, `getGroupDetail`, `uploadGroupDocument` functions — consumed by Tasks 8-10.

- [ ] **Step 1: Add types to `types/api.ts`**

```typescript
export interface GroupOut {
  id: string
  name: string
  subject: string | null
  owner_id: string
  owner_name: string
  join_code: string
  member_count: number
  conversation_id: string
}

export interface GroupMemberOut {
  id: string
  display_name: string
  is_owner: boolean
}

export interface GroupDetailOut {
  id: string
  name: string
  subject: string | null
  join_code: string
  conversation_id: string
  members: GroupMemberOut[]
}

export interface JoinGroupResponse {
  group: GroupOut
  already_member: boolean
}
```

And add one field to the existing `RichThreadOut` interface (found at line 118):
```typescript
export interface RichThreadOut {
  // ...existing fields unchanged...
  origin_group_name: string | null
}
```

- [ ] **Step 2: Create `frontend/src/api/groups.ts`**

```typescript
import type { GroupDetailOut, GroupOut, JoinGroupResponse } from '../types/api'
import client from './client'

export async function createGroup(name: string, subject?: string): Promise<GroupOut> {
  const res = await client.post<GroupOut>('/api/student/groups', { name, subject })
  return res.data
}

export async function getMyGroups(): Promise<GroupOut[]> {
  const res = await client.get<GroupOut[]>('/api/student/groups')
  return res.data
}

export async function joinGroup(joinCode: string): Promise<JoinGroupResponse> {
  const res = await client.post<JoinGroupResponse>(`/api/student/groups/join/${joinCode}`)
  return res.data
}

export async function getGroupDetail(groupId: string): Promise<GroupDetailOut> {
  const res = await client.get<GroupDetailOut>(`/api/student/groups/${groupId}`)
  return res.data
}

export async function uploadGroupDocument(groupId: string, file: File, title: string): Promise<void> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('title', title)
  await client.post(`/api/student/groups/${groupId}/documents/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
```

- [ ] **Step 3: Verify it type-checks**

Run:
```bash
cd frontend && npx tsc --noEmit
```
Expected: no new errors referencing `groups.ts` or `types/api.ts`.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/types/api.ts frontend/src/api/groups.ts
git commit -m "$(cat <<'EOF'
feat: add frontend types and API client for study groups

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: CreateGroupModal and JoinGroupModal

**Files:**
- Create: `frontend/src/components/CreateGroupModal.tsx`
- Create: `frontend/src/components/JoinGroupModal.tsx`

**Interfaces:**
- Consumes: `createGroup`, `joinGroup` from `../api/groups`; `Button` from `@/components/ui/button`.
- Produces: `<CreateGroupModal open, onClose, onCreated={(group: GroupOut) => void} />`, `<JoinGroupModal open, onClose, onJoined={(group: GroupOut) => void} />` — consumed by Task 9.

Model both directly on the existing join-course modal pattern in `frontend/src/pages/ClassListPage.tsx:63-99` (same overlay/animation/error-by-status-code structure), swapping the API call.

- [ ] **Step 1: Write `CreateGroupModal.tsx`**

```tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { createGroup } from '../api/groups'
import type { GroupOut } from '../types/api'
import { Button } from '@/components/ui/button'

export default function CreateGroupModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: (group: GroupOut) => void }) {
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')

  const mutation = useMutation({
    mutationFn: () => createGroup(name.trim(), subject.trim() || undefined),
    onSuccess: (group) => {
      onCreated(group)
      setName('')
      setSubject('')
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Create a Study Group</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); if (name.trim()) mutation.mutate() }}
          className="space-y-3"
        >
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Group name (e.g. EECS 551)"
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject (optional, e.g. Matrix Methods for ML)"
            maxLength={200}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {mutation.isError && (
            <p className="text-xs text-destructive">Something went wrong. Please try again.</p>
          )}
          <Button type="submit" className="w-full" disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending ? 'Creating…' : 'Create Group'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Write `JoinGroupModal.tsx`**

```tsx
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { joinGroup } from '../api/groups'
import type { GroupOut } from '../types/api'
import { Button } from '@/components/ui/button'

export default function JoinGroupModal({
  open, onClose, onJoined,
}: { open: boolean; onClose: () => void; onJoined: (group: GroupOut) => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (joinCode: string) => joinGroup(joinCode),
    onSuccess: (res) => {
      onJoined(res.group)
      setCode('')
      setError(null)
    },
    onError: (err: unknown) => {
      const status = (err as { response?: { status?: number } })?.response?.status
      setError(status === 404 ? 'Invalid group code.' : 'Something went wrong. Please try again.')
    },
  })

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Join a Study Group</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors rounded-lg p-1 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Paste the code a classmate shared with you.</p>
        <form
          onSubmit={(e) => { e.preventDefault(); if (code.trim()) { setError(null); mutation.mutate(code.trim()) } }}
          className="space-y-3"
        >
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. a3f8b2c1"
            maxLength={20}
            className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-primary/30"
            autoFocus
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full" disabled={!code.trim() || mutation.isPending}>
            {mutation.isPending ? 'Joining…' : 'Join Group'}
          </Button>
        </form>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 3: Verify it type-checks**

```bash
cd frontend && npx tsc --noEmit
```
Expected: no errors referencing these two files.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/CreateGroupModal.tsx frontend/src/components/JoinGroupModal.tsx
git commit -m "$(cat <<'EOF'
feat: add create/join study group modals

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: GroupWorkspacePage — Discord-style sidebar + conversation + members

**Files:**
- Create: `frontend/src/pages/GroupWorkspacePage.tsx`
- Modify: `frontend/src/App.tsx` (add routes)

**Interfaces:**
- Consumes: `getMyGroups`, `getGroupDetail` from `../api/groups`; `getQuestions`, `postQuestion` from `../api/sessions` (existing, called against `conversation_id`); `renderAnswerWithCitations` from `../components/AnswerRenderer`; `CreateGroupModal`, `JoinGroupModal` from Task 8.
- Produces: route `/groups` (list-and-redirect-to-first) and `/groups/:groupId` (workspace).

This intentionally does **not** reuse `ChatPage.tsx` directly (that file is already large and covers institutional-only concerns — PDF panel, professor personality settings, save-to-notes). Instead it composes the same underlying API functions (`getQuestions`/`postQuestion` — the actual RAG reuse the spec requires) into new, focused Discord-style chrome.

- [ ] **Step 1: Write `GroupWorkspacePage.tsx`**

```tsx
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Users, Copy, Check } from 'lucide-react'
import { getMyGroups, getGroupDetail } from '../api/groups'
import { getQuestions, postQuestion } from '../api/sessions'
import { renderAnswerWithCitations } from '../components/AnswerRenderer'
import CreateGroupModal from '../components/CreateGroupModal'
import JoinGroupModal from '../components/JoinGroupModal'
import { Button } from '@/components/ui/button'

function GroupSidebar({ activeGroupId }: { activeGroupId: string | undefined }) {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: groups = [] } = useQuery({ queryKey: ['my-groups'], queryFn: getMyGroups })

  return (
    <div className="w-60 shrink-0 border-r border-border bg-muted/30 flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">My Groups</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" /> Create
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setJoinOpen(true)}>
            Join
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {groups.map((g) => (
          <button
            key={g.id}
            onClick={() => navigate(`/groups/${g.id}`)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              g.id === activeGroupId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'
            }`}
          >
            {g.name}
          </button>
        ))}
        {groups.length === 0 && (
          <p className="text-xs text-muted-foreground p-2">No groups yet. Create or join one.</p>
        )}
      </div>

      <CreateGroupModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(group) => {
          queryClient.invalidateQueries({ queryKey: ['my-groups'] })
          setCreateOpen(false)
          navigate(`/groups/${group.id}`)
        }}
      />
      <JoinGroupModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onJoined={(group) => {
          queryClient.invalidateQueries({ queryKey: ['my-groups'] })
          setJoinOpen(false)
          navigate(`/groups/${group.id}`)
        }}
      />
    </div>
  )
}

function MembersPanel({ groupId }: { groupId: string }) {
  const { data: detail } = useQuery({ queryKey: ['group-detail', groupId], queryFn: () => getGroupDetail(groupId) })
  const [copied, setCopied] = useState(false)

  if (!detail) return null

  return (
    <div className="w-56 shrink-0 border-l border-border p-3 flex flex-col gap-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" /> Members ({detail.members.length})
        </h3>
        <div className="space-y-1.5">
          {detail.members.map((m) => (
            <div key={m.id} className="text-sm text-foreground flex items-center gap-1.5">
              {m.display_name}
              {m.is_owner && <span className="text-xs text-muted-foreground">(owner)</span>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Invite classmates</h3>
        <button
          onClick={() => { navigator.clipboard.writeText(detail.join_code); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg border border-border bg-background text-xs font-mono"
        >
          {detail.join_code}
          {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
      </div>
    </div>
  )
}

function Conversation({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState('')
  const queryClient = useQueryClient()

  const { data: questions = [] } = useQuery({
    queryKey: ['group-questions', conversationId],
    queryFn: () => getQuestions(conversationId),
    refetchInterval: 5000,
  })

  const askMutation = useMutation({
    mutationFn: () => postQuestion(conversationId, content.trim()),
    onSuccess: () => {
      setContent('')
      queryClient.invalidateQueries({ queryKey: ['group-questions', conversationId] })
    },
  })

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {questions.map((q) => (
          <div key={q.question_id} className="space-y-1.5">
            <p className="text-sm text-foreground"><span className="font-medium">{q.anonymous ? 'Anonymous' : 'Student'}:</span> {q.content}</p>
            {q.answer && (
              <div className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">
                <span className="font-medium text-primary">Horizon: </span>
                {renderAnswerWithCitations(q.answer.content, q.answer.citations)}
              </div>
            )}
          </div>
        ))}
        {questions.length === 0 && (
          <p className="text-sm text-muted-foreground">No questions yet. Ask the first one below.</p>
        )}
      </div>
      <form
        onSubmit={(e) => { e.preventDefault(); if (content.trim()) askMutation.mutate() }}
        className="p-3 border-t border-border flex gap-2"
      >
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Ask your group..."
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <Button type="submit" disabled={!content.trim() || askMutation.isPending}>
          {askMutation.isPending ? 'Asking…' : 'Ask'}
        </Button>
      </form>
    </div>
  )
}

export default function GroupWorkspacePage() {
  const { groupId } = useParams<{ groupId: string }>()
  const { data: detail } = useQuery({
    queryKey: ['group-detail', groupId],
    queryFn: () => getGroupDetail(groupId as string),
    enabled: !!groupId,
  })

  return (
    <div className="flex h-screen">
      <GroupSidebar activeGroupId={groupId} />
      {detail ? (
        <>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="p-3 border-b border-border">
              <h1 className="text-base font-semibold text-foreground">{detail.name}</h1>
              {detail.subject && <p className="text-xs text-muted-foreground">{detail.subject}</p>}
            </div>
            <Conversation conversationId={detail.conversation_id} />
          </div>
          <MembersPanel groupId={groupId as string} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a group from the sidebar.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Add routes in `App.tsx`**

Add, near the other `requireRole="student"` routes (around line 30-38):

```tsx
      <Route path="/groups" element={<ProtectedRoute requireRole="student"><GroupWorkspacePage /></ProtectedRoute>} />
      <Route path="/groups/:groupId" element={<ProtectedRoute requireRole="student"><GroupWorkspacePage /></ProtectedRoute>} />
```

And import it at the top of `App.tsx` alongside the other page imports:
```tsx
import GroupWorkspacePage from './pages/GroupWorkspacePage'
```

- [ ] **Step 3: Manual browser verification**

```bash
cd frontend && npm run dev
```
Log in as `alice@example.com` / `devpassword`, navigate to `/groups`, click **Create**, create "EECS 551", confirm you land on `/groups/<id>` with the sidebar showing the group, ask a question in the input, confirm it appears with an AI answer (citations rendered) within ~5s of posting. Copy the invite code from the members panel, log in as `bob@example.com` in a second browser/incognito window, go to `/groups`, click **Join**, paste the code, confirm Bob lands in the same group and sees Alice's question and can ask his own.

Also confirm the spec's "My Chats spans all groups" requirement is already satisfied without new code: as Alice, navigate to `/notes` (the existing `NotesPage`). `getSavedAnswers()` has no course/session filter — it already queries by `student_id` alone — so saving an answer from inside the EECS 551 group (via the existing save-answer affordance, if present in this new UI, or via `POST /api/student/answers/{answer_id}/save` directly with curl) should make it appear in `/notes` grouped under the group's name (the session title, which is the group name set in Task 3). No code change needed here — this is verification only.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/GroupWorkspacePage.tsx frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
feat: add Discord-style study group workspace UI

Sidebar of groups, center conversation (reuses existing
getQuestions/postQuestion against the group's conversation_id),
right member list with copyable invite code.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Home page (three sections only)

**Files:**
- Create: `frontend/src/pages/HomePage.tsx`
- Modify: `frontend/src/App.tsx` (add route only — do not change the existing `/` landing route or `DefaultRedirect` logic)

**Interfaces:**
- Consumes: a new `getHome()` function added to `frontend/src/api/groups.ts`.

- [ ] **Step 1: Add the API function**

Append to `frontend/src/api/groups.ts`:

```typescript
export interface HomeResponse {
  continue_studying: { course_id: string; name: string; course_type: 'institutional' | 'study_group' }[]
  recent_activity: { question_id: string; content: string; asked_at: string; course_name: string }[]
  groups: { id: string; name: string }[]
}

export async function getHome(): Promise<HomeResponse> {
  const res = await client.get<HomeResponse>('/api/student/home')
  return res.data
}
```

- [ ] **Step 2: Write `HomePage.tsx`**

```tsx
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getHome } from '../api/groups'
import DashboardLayout from '@/components/DashboardLayout'

export default function HomePage() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['home'], queryFn: getHome })

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-foreground mb-6">Home</h1>

      {isLoading && <p className="text-muted-foreground">Loading…</p>}

      {data && (
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Continue studying</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.continue_studying.map((c) => (
                <button
                  key={c.course_id}
                  onClick={() => navigate(c.course_type === 'study_group' ? `/groups` : `/classes/${c.course_id}`)}
                  className="text-left p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                >
                  <p className="font-medium text-foreground">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.course_type === 'study_group' ? 'Study group' : 'Class'}</p>
                </button>
              ))}
              {data.continue_studying.length === 0 && (
                <p className="text-sm text-muted-foreground">Nothing yet — join a class or create a study group to get started.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Recent activity</h2>
            <div className="space-y-2">
              {data.recent_activity.map((a) => (
                <div key={a.question_id} className="text-sm text-foreground">
                  <span className="text-muted-foreground">{a.course_name}:</span> {a.content}
                </div>
              ))}
              {data.recent_activity.length === 0 && (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Your groups</h2>
            <div className="flex flex-wrap gap-2">
              {data.groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate(`/groups/${g.id}`)}
                  className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-primary/40 transition-colors"
                >
                  {g.name}
                </button>
              ))}
              {data.groups.length === 0 && (
                <p className="text-sm text-muted-foreground">No groups yet.</p>
              )}
            </div>
          </section>
        </div>
      )}
    </DashboardLayout>
  )
}
```

- [ ] **Step 3: Add the route**

In `App.tsx`, add:

```tsx
      <Route path="/home" element={<ProtectedRoute requireRole="student"><HomePage /></ProtectedRoute>} />
```

with the import:
```tsx
import HomePage from './pages/HomePage'
```

- [ ] **Step 4: Manual browser verification**

With the dev servers running, log in as `alice@example.com`, navigate to `/home`. Confirm exactly three sections render (continue studying, recent activity, your groups) and the "EECS 551" group from Task 9 appears in "Your groups" and is clickable through to `/groups/<id>`.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/HomePage.tsx frontend/src/api/groups.ts frontend/src/App.tsx
git commit -m "$(cat <<'EOF'
feat: add Home page (continue studying, recent activity, your groups)

Deliberately capped to these three sections per spec — not a general
personalized dashboard.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Explicitly out of scope (do not implement)

- Delete-group endpoint. The spec's authorization matrix names it (owner-only) for completeness, but no MVP flow in the spec's user journey requires deleting a group, so it's not built here — add it as its own task, with its own authz test, if/when a real need appears.
- Fork "share back to group" UI affordance inside `GroupWorkspacePage` (the backend already supports it via the existing `fork_thread`/`shared` mechanism enriched in Task 6; wiring a "Fork" / "Share back" button into the new conversation view is follow-up work once this MVP flow is validated, not part of this plan).
- Payments, discovery, moderation, per-member roles beyond owner/member, educator/platform analytics — all per spec non-goals.
- Making `/home` the default post-login landing route — left as a manual route for now; changing `DefaultRedirect` behavior is a product decision to make after trying the flow, not bundled into this plan.
