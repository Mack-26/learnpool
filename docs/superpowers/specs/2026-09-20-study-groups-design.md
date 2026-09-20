# Study Groups: Student-Led Collaborative Layer — Design

## Context

LearnPool (Horizon) is currently institution-first: a professor creates a
course, controls session lifecycle, uploads materials, and students can only
participate once enrolled by that professor. This is a slow, procurement-heavy
go-to-market motion.

This spec adds a **student-led self-serve wedge**: any student can create a
"study group," get a shareable join link, invite classmates, upload
materials, and ask/answer questions — with no professor, no institutional
buy-in, and no approval step. The institutional product is not replaced;
study groups are a second, faster acquisition channel that reuses the
existing RAG/question/answer/comment/vote/fork infrastructure.

Business framing: study groups are the low-friction acquisition and
proof-of-usage wedge. Monetization can expand from individual learners into
educators, education businesses, and platforms once usage is validated — no
single B2B motion is hard-coded as "the" revenue path at this stage. This
spec covers **only** the study-group product layer — no payments, discovery,
moderation, or educator-analytics upgrade path.

## Goals

- A student can create a group, get a join link, invite classmates, upload
  materials, and have a continuous group conversation with AI + peers —
  entirely self-serve.
- Reuse the existing RAG pipeline, `questions`/`answers`/`answer_citations`,
  `question_comments`, `answer_feedback`, and `threads` (fork/share)
  infrastructure without duplication.
- Preserve the existing student experience (dashboard, personal threads,
  forking) as a distinct layer from the new group workspace — this is an
  additive collaborative layer, not a replacement.
- Keep `courses.professor_id` semantically honest: it never holds a
  student's user id.

## Non-goals (explicitly out of scope for this pass)

- Payments, plan limits, or paywalls.
- Public group discovery/browsing.
- Moderation tooling, per-member roles beyond owner/member.
- Educator/platform (GregMat-style) analytics or official-content upgrade
  path.
- Any change to the institutional professor-led session lifecycle.

## Data model changes

Small additive migration (`db/migrations/007_study_groups.sql`), no breaking
changes to existing tables besides relaxing one NOT NULL constraint.

```sql
-- courses: distinguish institutional vs. self-serve, and stop conflating
-- "owner" with "professor"
CREATE TYPE course_type AS ENUM ('institutional', 'study_group');
ALTER TABLE courses ADD COLUMN course_type course_type NOT NULL DEFAULT 'institutional';
ALTER TABLE courses ALTER COLUMN professor_id DROP NOT NULL;
-- professor_id stays NULL for study_group courses; enforced at application layer.

-- study_groups: authoritative ownership + join mechanism for self-serve groups.
-- One-to-one with a study_group-typed course.
CREATE TABLE study_groups (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
    owner_id   UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    join_code  TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_groups_owner ON study_groups (owner_id);
CREATE INDEX idx_study_groups_join_code ON study_groups (join_code);
```

`course_enrollments` (existing table) remains the single source of truth for
membership/authorization for **both** institutional courses and study
groups. Joining a group via `join_code` inserts a `course_enrollments` row
directly — no approval step. This means every existing "is this user allowed
here" join across `student_router.py` / `rag_service.py` needs zero changes.

`sessions` (existing table): a `study_group` course gets exactly one session
row created at group-creation time, with `status = 'active'` forever. It
never transitions to `ended`/`released`. This is an **internal
implementation detail only** — see API/UX rule below.

No changes to `documents`, `document_chunks`, `questions`, `answers`,
`answer_citations`, `question_comments`, `answer_feedback`, or `threads`.
All are already keyed generically enough (by `course_id` or `session_id`) to
work for study groups unmodified.

## Hard rules carried into implementation

1. `professor_id` is never set to a student's user id. It is `NULL` for
   `study_group` courses.
2. `study_groups.owner_id` is the authoritative owner reference.
3. `course_enrollments` remains the membership/authorization source of truth
   — do not introduce a parallel membership table.
4. One persistent internal `sessions` row per study group is acceptable
   internal reuse.
5. The word "session" never appears in study-group-facing API response
   fields, error messages, or UI copy — call it a "conversation" or just the
   group name.
6. Existing `threads` fork/share infrastructure is reused as-is for the
   fork → private exploration → optional share-back loop.
7. The existing student Home/dashboard experience is additive, not replaced.
8. "My Groups" (shared, with people) and "My Chats" (private, with AI) remain
   visually and conceptually distinct destinations.
9. Fork → private exploration → optional share-back into the origin group is
   preserved and works cross-context (a group's shared thread forks into a
   private thread in "My Chats"; sharing back flips it visible in the group).
10. No educator/platform functionality is built in this pass.

## Authorization matrix

`course_enrollments` (owner is also a row in this table, inserted at group
creation) is the sole authorization check. Explicit matrix, enforced on
every group-scoped endpoint:

| Action              | Owner | Member | Non-member |
|---------------------|:-----:|:------:|:----------:|
| View group           | ✓     | ✓      | ✗          |
| Join via link        | ✓     | ✓      | ✓          |
| Upload material      | ✓     | ✓      | ✗          |
| Ask question         | ✓     | ✓      | ✗          |
| Comment / vote       | ✓     | ✓      | ✗          |
| Fork                 | ✓     | ✓      | ✗          |
| Share fork back      | ✓     | ✓      | ✗          |
| Get invite link      | ✓     | ✓      | ✗          |
| Delete group         | ✓     | ✗      | ✗          |

"Owner" is distinguished only via `study_groups.owner_id` (currently used
solely for the delete-group check and display attribution) — there is no
separate `role` column on `course_enrollments`; owner is still a normal
enrollment row for every other check.

`GET /api/student/groups/{group_id}` and every other group/document/
question/thread read must resolve authorization **before** returning any
data: the handler first checks
`EXISTS (SELECT 1 FROM course_enrollments WHERE course_id = $group.course_id AND student_id = $current_user)`
and returns 404 (not 403, to avoid confirming a group id's existence to a
non-member) if that check fails, only then querying and returning group
metadata, members, `conversation_id`, or invite code. The same
authorize-then-fetch ordering applies to any future group-scoped read
endpoint, to prevent group-id enumeration from leaking metadata.

## API changes

New router `backend/routers/group_router.py`, mounted under
`/api/student/groups` (student-authenticated only):

- `POST /api/student/groups` — create a group (`name`, `subject` optional).
  Creates: `courses` row (`course_type='study_group'`, `professor_id=NULL`),
  `study_groups` row (`owner_id=current_user`, generated `join_code`), one
  perpetual `sessions` row, and a `course_enrollments` row for the creator.
- `POST /api/student/groups/join/{join_code}` — idempotent: resolves the
  group from `join_code`, inserts a `course_enrollments` row with
  `ON CONFLICT (course_id, student_id) DO NOTHING` (the existing composite
  primary key already enforces this uniqueness — no schema change needed),
  and always returns the group's data with an `already_member: bool` flag.
  Clicking the same invite link twice must never surface an
  "already enrolled" error.
- `GET /api/student/groups` — list groups the current user belongs to
  (join `course_enrollments` → `courses` where `course_type='study_group'`).
- `GET /api/student/groups/{group_id}` — group detail: name, join link,
  member list, resolved session id (internal — response field is
  named `conversation_id`, not `session_id`).
- Document upload: existing document-upload path is reused, gated to "any
  enrolled member" instead of "professor only" when `course_type='study_group'`.
- Question/answer/comment/vote/fork endpoints in `student_router.py`: no
  route changes. They already operate on a `session_id` resolved from
  enrollment; a group's perpetual session id is passed the same way a
  course's active session id is today.
- `professor_router.py` session-lifecycle endpoints (start/end/release):
  add a guard rejecting `study_group` courses (400, "not applicable to study
  groups") since they should never be reachable from the group UI, but must
  not be exploitable via direct API call either.

Thread provenance enrichment (read-side only, no schema change): when
returning a thread that has `forked_from` set, join through
`forked_from → threads.session_id → sessions.course_id → study_groups.name`
(or `courses.name` for institutional) to include an `origin_group_name`
field for display ("Forked from EECS 551 Study Group").

## Frontend changes

Information architecture (left nav):

- **Home** — personal entry point, deliberately constrained for MVP to three
  things only (explicitly not a general personalized learning dashboard):
  1. Continue studying — recently active groups + recently active personal
     chats.
  2. Recent activity — someone answered your question, someone commented,
     new activity in one of your groups.
  3. Your groups — the list, as a fast way in.
  New page; requires a new cross-session aggregation query (does not exist
  today — current dashboard is scoped to one session at a time). No
  additional widgets, stats, or personalization beyond these three sections
  in this pass — the goal is routing the student into the group/chat they
  came for, not building an LMS homepage.
- **My Groups** — collaborative spaces. Discord-style layout: left sidebar
  of groups → center conversation (questions, AI answers, peer comments,
  votes, fork action inline) → right member list. New `GroupWorkspacePage`,
  `CreateGroupModal`, `JoinGroupModal`.
- **My Chats** — private learning space. Existing personal-threads view
  (`NotesPage`/thread list), generalized to span all groups/courses instead
  of one session.
- Existing `SessionDetailPage`/`ReportPage`/professor views: unchanged,
  continue to serve institutional courses exactly as today.

Invite is a first-class, always-visible action inside a group ("Invite
classmates" button with copy-link), not buried in settings, per the
acquisition-loop requirement.

## Testing

- Unit/integration: group creation → join-code join → enrollment row exists
  → member can upload a document → member can ask a question and get a
  RAG-grounded answer with citations → a second member can fork that
  question into a private thread → share-back flips `shared=true` and it
  reappears in the group view with correct `origin_group_name` provenance.
- Regression: existing institutional course flows (professor session
  lifecycle, enrollment via professor, reports) must be unaffected — covered
  by guarding `course_type` on the lifecycle endpoints.

## Open items intentionally deferred

- Instrumentation/analytics events for the study-group loop (explicitly
  deferred until this flow is validated, per prior discussion).
- Per-member roles beyond owner/member.
- Educator/platform (GregMat-style) ownership model — `study_groups.owner_id`
  is a `users.id` for now; extending ownership to a non-user entity
  (organization/platform) is a future migration, not this one.
