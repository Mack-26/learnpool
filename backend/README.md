# LearnPool Backend — Student live chat (GPT-4o)

FastAPI app: auth, student sessions, and **live Q&A with OpenAI GPT-4o** grounded in course materials (RAG).

---

## Prerequisites

- **Python 3.11+**
- **PostgreSQL 16 with pgvector** (use repo root: `make db-up` + `make db-seed`)
- **OpenAI API key** (for GPT-4o and embeddings)

---

## Quick start (student chat)

### 1. Database (from repo root)

```bash
cd ..   # to learnpool/
make db-up
make db-seed
```

### 2. Backend env and venv

```bash
# In backend/
cp .env.example .env
# Edit .env: set OPENAI_API_KEY and JWT_SECRET (e.g. 32 random chars)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate
pip install -r requirements.txt
```

### 3. Embed seed chunks (once after db-seed)

So the active session has RAG context from sample documents:

```bash
python scripts/embed_seed_chunks.py
```

### 4. Run the API

```bash
uvicorn main:app --reload --port 8000
```

- API: **http://localhost:8000**
- Docs: **http://localhost:8000/docs**
- Health: **http://localhost:8000/health**

### 5. Run the frontend (student chat UI)

In another terminal, from repo root:

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** → Log in as **alice@example.com** / **devpassword** → **Sessions** → open **Lecture 2 — Gradient Descent** (active) → use the chat. Questions go to GPT-4o with RAG over the seeded document chunks.

---

## .env (required)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql://learnpool:localdev@localhost:5432/learnpool` (local Docker) |
| `JWT_SECRET` | Random string (e.g. 32 chars) for signing tokens |
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o + text-embedding-3-small) |
| `OCI_NAMESPACE` / `OCI_BUCKET` | Optional; for professor document upload |

---

## Student chat flow

1. **POST /auth/login** — Frontend gets JWT.
2. **GET /api/student/sessions** — List sessions for the student.
3. **GET /api/student/sessions/{id}/check** — Enrolled + status (active/ended/released).
4. **POST /api/student/sessions/{id}/questions** — Send question → RAG (embed + retrieve chunks) → GPT-4o → save answer + citations → return.
5. **GET /api/student/sessions/{id}/questions** — Chat history for that student.

Only **active** sessions allow new questions; ended/released are read-only.

---

## Seed credentials

Password for all: **devpassword**

| Email | Role |
|-------|------|
| alice@example.com | student |
| bob@example.com | student |
| prof@example.com | professor |

**Active session ID (for curl):** `00000000-0000-0000-0000-000000000021`
