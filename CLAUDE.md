# LearnPool — Claude Code Guide

## What this project is

AI-powered classroom Q&A. Students ask questions during a live class session; the AI answers using only the course materials the professor has activated for that session (RAG over PDFs). Professors get a dashboard of all questions asked.

---

## Stack

| Layer | Technology |
|---|---|
| Database | PostgreSQL 16 + pgvector (Docker locally, OCI Managed PostgreSQL in prod) |
| Backend | Python 3.11, FastAPI, asyncpg |
| Frontend | React 18, TypeScript, Vite |
| AI (chat) | OpenAI GPT-4o |
| AI (embeddings) | OpenAI text-embedding-3-small (1536-dim — matches `vector(1536)` in schema) |
| Object storage | OCI Object Storage (`learnpool-documents` bucket) |

---

## Project layout

```
learnpool/
├── CLAUDE.md                  ← you are here
├── docker-compose.yml         ← local PostgreSQL + pgvector
├── Makefile                   ← db-up, db-down, db-reset, db-shell, db-seed
├── db/
│   ├── migrations/
│   │   └── 001_schema.sql     ← authoritative schema; auto-runs on first db-up
│   └── seed.sql               ← dev data; run with: make db-seed
├── backend/                   ← FastAPI app (Partner A)
│   ├── requirements.txt
│   ├── .env.example
│   ├── main.py
│   ├── database.py            ← asyncpg pool + get_db() dependency
│   ├── auth.py                ← JWT + bcrypt + get_current_user dependency
│   ├── models.py              ← all Pydantic request/response models
│   ├── routers/
│   │   ├── auth_router.py     ← POST /auth/login
│   │   └── student_router.py ← student Q&A endpoints
│   ├── services/
│   │   ├── openai_client.py  ← get_embedding(), get_chat_completion()
│   │   └── rag_service.py    ← 9-step RAG pipeline
│   └── scripts/
│       └── embed_seed_chunks.py  ← one-off: embed the 3 null seed chunks
└── frontend/                  ← React + Vite app (Partner B)
    ├── vite.config.ts         ← proxies /api and /auth → localhost:8000
    └── src/
        ├── types/api.ts       ← TypeScript interfaces for all API responses
        ├── api/               ← axios client + auth/sessions API functions
        ├── store/authStore.ts ← zustand auth state + localStorage
        ├── pages/             ← LoginPage, SessionListPage, ChatPage
        └── components/        ← MessageBubble, CitationCard, QuestionInput, etc.
```

---

## Running locally

### Prerequisites
- Docker Desktop running

### Database
```bash
make db-up     # start PostgreSQL (schema auto-applies on first run)
make db-seed   # load dev data (3 users, 1 course, 2 sessions, sample Q&A)
make db-shell  # open psql
make db-reset  # wipe volume + restart fresh
```

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # fill in OPENAI_API_KEY and JWT_SECRET
python scripts/embed_seed_chunks.py   # run once after db-seed
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev    # starts at http://localhost:5173
```

---

## Dev seed credentials

Password for all seed accounts: **`devpassword`**

| Email | Role |
|---|---|
| prof@example.com | professor |
| alice@example.com | student |
| bob@example.com | student |

Key seed IDs (used in curl tests and the embed script):
- Active session: `00000000-0000-0000-0000-000000000021`
- Released session: `00000000-0000-0000-0000-000000000020`

---

## Architecture decisions to be aware of

### Embedding dimension is locked
`document_chunks.embedding` is `vector(1536)`. Changing this requires dropping the column and re-embedding everything. **Do not switch embedding models without running `make db-reset` and re-running the embed script.**

### asyncpg + raw SQL, not SQLAlchemy
The RAG vector search uses `embedding <=> $2::vector` which requires passing pgvector-typed parameters. asyncpg handles this cleanly with a text cast (`"[0.1, 0.2, ...]"`). All DB queries in the backend are raw SQL via asyncpg — do not introduce SQLAlchemy.

### OpenAI SDK calls are sync — use asyncio.to_thread()
The OpenAI Python SDK v1.x is synchronous. All calls to `openai_client.py` functions inside async FastAPI routes must be wrapped: `await asyncio.to_thread(openai_client.get_embedding, text)`. Calling them directly blocks the event loop.

### storage_path is cloud-agnostic
The `documents.storage_path` column stores a relative object path like `courses/<id>/docs/<filename>.pdf`. The bucket name and OCI namespace come from environment variables at runtime. Never hardcode bucket names or OCI URLs in the schema or application logic.

### HTTP polling, not WebSocket
The student chat uses HTTP polling (React Query `refetchInterval: 5000`). The POST /questions endpoint is synchronous — it blocks until GPT-4o responds, then returns the full answer. No WebSocket infrastructure needed.

---

## Key SQL patterns

### Get active chunks for a session (RAG retrieval)
```sql
SELECT dc.id, dc.content, dc.page_number,
       1 - (dc.embedding <=> $2::vector) AS cosine_similarity
FROM document_chunks dc
WHERE dc.document_id = ANY($1::uuid[])
  AND dc.embedding IS NOT NULL
ORDER BY dc.embedding <=> $2::vector
LIMIT 5;
-- $1 = array of active document_ids from session_documents
-- $2 = query embedding as "[0.1, 0.2, ...]" string (cast to vector)
```

### Get active document IDs for a session
```sql
SELECT document_id FROM session_documents
WHERE session_id = $1 AND is_active = true;
```

### Session release toggle
```sql
UPDATE sessions SET status = 'released', ended_at = COALESCE(ended_at, now())
WHERE id = $1 AND status = 'ended'
RETURNING id, status;
```

---

## API surface (student endpoints)

All student routes require `Authorization: Bearer <token>` and `role = 'student'`.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Returns JWT token |
| GET | `/api/student/sessions` | Sessions for enrolled courses |
| GET | `/api/student/sessions/{id}/check` | Enrollment + status check |
| POST | `/api/student/sessions/{id}/questions` | Ask a question (runs full RAG pipeline) |
| GET | `/api/student/sessions/{id}/questions` | Chat history for this student |

---

## Adding a schema migration

Do NOT edit `001_schema.sql` — it only runs once on a fresh volume.

```bash
# Create the new migration
touch db/migrations/002_your_change.sql
# Write ALTER TABLE / CREATE TABLE statements

# Apply to running local DB
make db-shell
# In psql: \i /docker-entrypoint-initdb.d/002_your_change.sql
```

Coordinate with your partner before doing this — it requires both of you to run the migration or do `make db-reset`.
