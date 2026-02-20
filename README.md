# LearnPool

AI-powered classroom Q&A — students ask questions, the AI answers from course materials, professors monitor everything.

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (free) — provides PostgreSQL + pgvector in a container so both partners get an identical database without any local installs.

---

## First-time setup

```bash
# 1. Copy environment config (only needed once)
cp .env.example .env

# 2. Start the database
#    The schema in db/migrations/001_schema.sql runs automatically on first start.
make db-up

# 3. Load development data (professors, students, sample course + Q&A)
make db-seed

# 4. Verify everything is working
make db-shell
# You should see the `learnpool=#` prompt.
# Try: SELECT display_name, role FROM users;
# Type \q to exit.
```

---

## Daily workflow

| Command | What it does |
|---|---|
| `make db-up` | Start the database |
| `make db-down` | Stop the database (data is preserved) |
| `make db-reset` | Wipe all data and re-apply the schema from scratch |
| `make db-shell` | Open a live psql prompt |
| `make db-seed` | Load (or reload) development data |
| `make db-logs` | Tail the database container logs |

---

## Development seed credentials

Password for all seed accounts: **`devpassword`**

| Email | Role | ID |
|---|---|---|
| `prof@example.com` | professor | `00000000-0000-0000-0000-000000000001` |
| `alice@example.com` | student | `00000000-0000-0000-0000-000000000002` |
| `bob@example.com` | student | `00000000-0000-0000-0000-000000000003` |

Seed includes:
- 1 course (Intro to ML)
- 2 sessions (one released with Q&A, one active)
- 3 documents (2 ready, 1 still uploading)
- 3 questions and answers with citations

---

## Schema overview

10 tables across 5 domains:

```
users                   — professors and students (role column)
courses                 — owned by a professor
course_enrollments      — students <-> courses
sessions                — class meetings (active / ended / released)

documents               — PDFs uploaded by professors (storage_path is cloud-agnostic)
session_documents       — checkbox: which docs are active for a session
document_chunks         — chunked text + pgvector embeddings for RAG

questions               — student questions during a session
answers                 — AI-generated responses (model_used is recorded)
answer_citations        — which chunks were cited in each answer
```

Full DDL: [`db/migrations/001_schema.sql`](db/migrations/001_schema.sql)

---

## Adding schema changes

Do **not** edit `001_schema.sql` after the initial setup — it only runs once on a fresh volume.

Instead, create a new numbered file and apply it manually:

```bash
# Create your migration
touch db/migrations/002_add_question_tags.sql
# ... write your ALTER TABLE / CREATE TABLE statements ...

# Apply it to your running database
make db-shell
# Then inside psql: \i /docker-entrypoint-initdb.d/002_add_question_tags.sql
```

Or blow away local data and start clean (fine for development):

```bash
make db-reset
make db-seed
```

---

## Embedding model note

`document_chunks.embedding` is declared as `vector(1536)` — matching OpenAI `text-embedding-3-small` and `text-embedding-ada-002`. **This dimension is fixed at the schema level.** If you switch embedding models, coordinate with your partner and run `make db-reset` before re-embedding. See [`db/migrations/001_schema.sql`](db/migrations/001_schema.sql) for alternatives.

---

## Connection string

```
postgresql://learnpool:localdev@localhost:5432/learnpool
```

Set `DATABASE_URL` in your `.env` to this value (already set in `.env.example`).
