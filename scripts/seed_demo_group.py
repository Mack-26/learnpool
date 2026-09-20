"""Seed a realistic study group for a demo student.

Usage:
  API=http://localhost:8000 DATABASE_URL=postgresql://... OWNER_EMAIL=aromanan@umich.edu \
      python scripts/seed_demo_group.py

The group itself is owned by OWNER_EMAIL (created directly in the database so no password is
needed). Classmates are real accounts created through the API (password printed at the end);
they join with the invite code, upload materials, ask questions (real RAG answers) and reply.
The owner's own question, a reply, and a private exploration are inserted directly, citing
real chunks from the uploaded materials. Idempotent: skips if the group already exists.
"""
import json
import os
import secrets
import sys
import urllib.request

import psycopg2

API = os.environ.get("API", "http://localhost:8000").rstrip("/")
DB = os.environ["DATABASE_URL"]
OWNER = os.environ.get("OWNER_EMAIL", "aromanan@umich.edu")
GROUP_NAME = "EECS 551 — SVD Study Group"
GROUP_SUBJECT = "Matrix Methods for Signal Processing, Data Analysis & ML"
DEMO_DOMAIN = "demo.horizonlabs.live"
PASSWORD = os.environ.get("DEMO_PASSWORD") or ("horizon-" + secrets.token_hex(4))

CLASSMATES = [
    ("Sarah Mehta", "sarah.mehta"),
    ("David Okonkwo", "david.okonkwo"),
    ("Mei-Lin Chen", "meilin.chen"),
    ("Jonas Weber", "jonas.weber"),
]

LECTURE_7 = """Lecture 7 — Singular Value Decomposition

Any real m×n matrix A can be factored as A = U Σ Vᵀ, where U and V are orthogonal and Σ is diagonal with non-negative entries σ₁ ≥ σ₂ ≥ … ≥ σᵣ > 0, the singular values. The columns of U and V are the left and right singular vectors.

The singular values measure how much each orthogonal direction contributes to the transformation: σᵢ is the amount by which A stretches the i-th right singular vector. Because they are ordered from largest to smallest, the leading singular values carry most of the "energy" of the matrix.

The Frobenius norm is unitarily invariant and equals the root sum of squared singular values: ‖A‖_F² = Σ σᵢ². The spectral norm equals the largest singular value: ‖A‖₂ = σ₁. Orthogonal transformations (rotations and reflections) do not change either norm, because they do not change the singular values.

Eckart–Young theorem. The best rank-k approximation of A in the Frobenius norm is obtained by keeping the top k singular values and setting the rest to zero: A_k = U_k Σ_k V_kᵀ. The approximation error is ‖A − A_k‖_F² = Σ_{i>k} σᵢ². This is why truncated SVD is used for dimensionality reduction, low-rank compression, and principal component analysis: keeping the directions with the most spread preserves most of the structure in the data.

PCA connection. If the columns of X are centred, the principal components are the right singular vectors of X, and the variance captured by component i is σᵢ²/(n−1). Computing PCA through the SVD avoids forming the covariance matrix XᵀX, which squares the condition number.
"""

HOMEWORK_3 = """Homework 3 — Low-rank approximation

Q1. For A = [[3, 0], [4, 5]], compute the singular values and write the full SVD.

Q2(a). Show that for any orthogonal Q, ‖QA‖_F = ‖A‖_F and ‖QA‖₂ = ‖A‖₂. Hint: use the SVD of A and the fact that QU is orthogonal.

Q2(b). Let A be 6×4 with singular values 9, 4, 1, 0.5. What is the Frobenius-norm error of the best rank-2 approximation? What is the spectral-norm error? Which bound is tighter, and why?

Q3. Explain in one paragraph why truncating the SVD at k components gives the best rank-k approximation. State the theorem you rely on.

Q4. A dataset X (1000×50, centred) has singular values that decay as σᵢ ≈ 40 / i. How many components are needed to capture 90% of the total variance?
"""


def api(path, token=None, body=None, files=None):
    url = API + path
    if files:
        boundary = "----seed" + secrets.token_hex(8)
        parts = []
        for name, (fname, content) in files.items():
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{name}\"; filename=\"{fname}\"\r\nContent-Type: text/plain\r\n\r\n{content}\r\n")
        for k, v in (body or {}).items():
            parts.append(f"--{boundary}\r\nContent-Disposition: form-data; name=\"{k}\"\r\n\r\n{v}\r\n")
        data = ("".join(parts) + f"--{boundary}--\r\n").encode()
        req = urllib.request.Request(url, data=data, method="POST", headers={"Content-Type": f"multipart/form-data; boundary={boundary}"})
    else:
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(url, data=data, method="POST" if body is not None or path.endswith("/share") else "GET", headers={"Content-Type": "application/json"})
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode() or "null")


def login_or_signup(name, local):
    email = f"{local}@{DEMO_DOMAIN}"
    try:
        return api("/auth/login", body={"email": email, "password": PASSWORD})["access_token"], email
    except Exception:
        return api("/auth/signup", body={"email": email, "password": PASSWORD, "display_name": name, "role": "student"})["access_token"], email


def main():
    conn = psycopg2.connect(DB)
    conn.autocommit = True
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE email=%s", (OWNER,))
    row = cur.fetchone()
    if not row:
        sys.exit(f"owner {OWNER} not found")
    owner_id = row[0]

    cur.execute("SELECT c.id, c.invite_code, sg.id FROM courses c JOIN study_groups sg ON sg.course_id=c.id WHERE c.name=%s AND sg.owner_id=%s", (GROUP_NAME, owner_id))
    row = cur.fetchone()
    if row:
        print("group already exists:", row[2], "code", row[1])
        return
    code = secrets.token_hex(4)
    cur.execute("INSERT INTO courses (professor_id, name, description, course_type, invite_code) VALUES (NULL, %s, %s, 'study_group', %s) RETURNING id", (GROUP_NAME, GROUP_SUBJECT, code))
    course_id = cur.fetchone()[0]
    cur.execute("INSERT INTO study_groups (course_id, owner_id) VALUES (%s, %s) RETURNING id", (course_id, owner_id))
    group_id = cur.fetchone()[0]
    cur.execute("INSERT INTO sessions (course_id, title, status, started_at) VALUES (%s, %s, 'active', now() - interval '6 days') RETURNING id", (course_id, GROUP_NAME))
    session_id = cur.fetchone()[0]
    cur.execute("INSERT INTO course_enrollments (course_id, student_id, enrolled_at) VALUES (%s, %s, now() - interval '6 days')", (course_id, owner_id))
    print("created group", group_id, "code", code)

    tokens = {}
    for name, local in CLASSMATES:
        tok, email = login_or_signup(name, local)
        tokens[name] = tok
        api(f"/api/student/groups/join/{code}", tok, body={})
        print("joined:", name, email)

    sarah, david, meilin, jonas = (tokens[n] for n, _ in CLASSMATES)
    lec = api(f"/api/student/groups/{group_id}/documents/upload", sarah, body={"title": "Lecture 7 — SVD"}, files={"file": ("Lecture_7_SVD.txt", LECTURE_7)})
    hw = api(f"/api/student/groups/{group_id}/documents/upload", david, body={"title": "Homework 3"}, files={"file": ("Homework_3.txt", HOMEWORK_3)})
    print("uploaded materials")

    q1 = api(f"/api/student/groups/{group_id}/questions", david, body={"content": "Why does truncating the SVD give the best rank-k approximation? Which theorem is that?", "focus_document_id": lec["id"]})
    q2 = api(f"/api/student/groups/{group_id}/questions", meilin, body={"content": "For HW3 Q2(b), do I use the Frobenius norm or the spectral norm for the error of the rank-2 approximation?", "focus_document_id": hw["id"]})
    q3 = api(f"/api/student/groups/{group_id}/questions", sarah, body={"content": "Is PCA literally just the SVD of the centred data matrix, or is there more to it?", "focus_document_id": lec["id"]})
    api(f"/api/student/questions/{q1['question_id']}/comments", jonas, body={"content": "This matches what she said in lecture — keep the directions with the most spread and the error is just the tail of squared singular values."})
    api(f"/api/student/questions/{q2['question_id']}/comments", sarah, body={"content": "Both work, but Q2(b) explicitly asks which bound is tighter, so compute both: Frobenius uses the tail sum, spectral is just σ₃."})
    api(f"/api/student/questions/{q3['question_id']}/comments", david, body={"content": "The 'more to it' is the centring — forget to centre and the first component just points at the mean."})
    print("asked 3 questions with replies")

    # Owner's own question + answer citing a real chunk from Lecture 7
    cur.execute("SELECT id, content, page_number FROM document_chunks WHERE document_id=%s ORDER BY chunk_index LIMIT 1", (lec["id"],))
    chunk = cur.fetchone()
    cur.execute("INSERT INTO questions (session_id, student_id, content, anonymous, visibility, focus_document_id, asked_at, category) VALUES (%s, %s, %s, false, 'group', %s, now() - interval '2 days', 'concept') RETURNING id",
                (session_id, owner_id, "Does the Frobenius norm change if I multiply A by an orthogonal matrix?", lec["id"]))
    owner_q = cur.fetchone()[0]
    cur.execute("INSERT INTO answers (question_id, content, model_used, generation_latency_ms, generated_at) VALUES (%s, %s, 'gpt-4o', 2100, now() - interval '2 days') RETURNING id",
                (owner_q, "No. The Frobenius norm is unitarily invariant: ‖QA‖_F = ‖A‖_F for any orthogonal Q, because ‖A‖_F² = Σσᵢ² depends only on the singular values, and multiplying by an orthogonal matrix leaves them unchanged [1]. The same holds for the spectral norm, which is just σ₁."))
    owner_a = cur.fetchone()[0]
    cur.execute("INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order) VALUES (%s, %s, 0.91, 1)", (owner_a, chunk[0]))
    api(f"/api/student/questions/{owner_q}/comments", meilin, body={"content": "That's exactly Q2(a) on the homework — the hint about QU being orthogonal is the whole proof."})

    # Owner's private exploration forked from David's question
    cur.execute("UPDATE questions SET fork_count = fork_count + 1 WHERE id=%s", (q1["question_id"],))
    cur.execute("INSERT INTO questions (session_id, student_id, content, anonymous, visibility, forked_from, focus_document_id, asked_at) VALUES (%s, %s, %s, false, 'private', %s, %s, now() - interval '1 day') RETURNING id",
                (session_id, owner_id, "[Forked from: \"Why does truncating the SVD give the best rank-k approximation?\"]\n\nWhat happens to the approximation error if I keep one fewer singular value than needed?", q1["question_id"], lec["id"]))
    fork_q = cur.fetchone()[0]
    cur.execute("INSERT INTO answers (question_id, content, model_used, generation_latency_ms, generated_at) VALUES (%s, %s, 'gpt-4o', 1900, now() - interval '1 day') RETURNING id",
                (fork_q, "The error grows by exactly the square of the singular value you dropped. Keeping k−1 instead of k components adds σ_k² to ‖A − A_{k−1}‖_F², since the error is the tail sum Σ_{i>k} σᵢ² [1]. If σ_k is small relative to the leading values, you lose almost nothing; if the singular values decay slowly, every dropped component costs you noticeably."))
    fork_a = cur.fetchone()[0]
    cur.execute("INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order) VALUES (%s, %s, 0.88, 1)", (fork_a, chunk[0]))
    print("added owner question, reply, and private exploration")
    print(f"\nDONE — group {group_id}, invite code {code}\nclassmate accounts: *@{DEMO_DOMAIN} / password {PASSWORD}")


if __name__ == "__main__":
    main()
