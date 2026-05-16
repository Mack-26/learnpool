import asyncio

import asyncpg
import numpy as np

from config import settings
from models import AnswerOut, CitationOut, QuestionOut
from services import openai_client

_PERSONALITY_INSTRUCTIONS: dict[str, str] = {
    "supportive": (
        "Use an encouraging, patient, and supportive teaching style. "
        "Acknowledge the student's effort and guide them step by step."
    ),
    "normal": (
        "Use a clear, concise, and professional teaching style."
    ),
    "funny": (
        "Use a friendly, light-hearted style with occasional tasteful humour "
        "to make learning enjoyable — but keep all information accurate."
    ),
}


async def handle_question(
    session_id: str,
    student_id: str,
    content: str,
    db: asyncpg.Connection,
    personality: str = "supportive",
    anonymous: bool = False,
) -> QuestionOut:
    """Full RAG pipeline: save question → embed → retrieve top chunks → generate → save answer+citations → return."""

    # Step 1: Save question
    q_row = await db.fetchrow(
        "INSERT INTO questions (session_id, student_id, content, anonymous) VALUES ($1, $2, $3, $4) RETURNING id, asked_at",
        session_id,
        student_id,
        content,
        anonymous,
    )
    question_id = str(q_row["id"])

    # Step 2: Embed the question
    query_embedding = await asyncio.to_thread(openai_client.get_embedding, content)

    # Step 3: Get active document IDs for this session
    doc_rows = await db.fetch(
        "SELECT document_id FROM session_documents WHERE session_id = $1 AND is_active = true",
        session_id,
    )
    active_doc_ids = [str(r["document_id"]) for r in doc_rows]

    # Step 4: Vector similarity search — top 20 candidates, ranked by relevance
    chunks: list[dict] = []
    if active_doc_ids:
        embedding_vec = np.array(query_embedding, dtype=np.float32)
        chunk_rows = await db.fetch(
            """
            SELECT dc.id, dc.content, dc.page_number, dc.token_count, d.id AS document_id, d.filename,
                   1 - (dc.embedding <=> $2) AS cosine_similarity
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.document_id = ANY($1::uuid[])
              AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> $2
            LIMIT 20
            """,
            active_doc_ids,
            embedding_vec,
        )
        chunks = [dict(r) | {"is_real_chunk": True} for r in chunk_rows]

        # Append inline-text documents (no chunks/embeddings) ranked last
        doc_content_rows = await db.fetch(
            """
            SELECT d.id, d.filename, d.content
            FROM documents d
            WHERE d.id = ANY($1::uuid[])
              AND d.content IS NOT NULL
              AND trim(d.content) != ''
              AND NOT EXISTS (
                  SELECT 1 FROM document_chunks dc WHERE dc.document_id = d.id
              )
            """,
            active_doc_ids,
        )
        for r in doc_content_rows:
            chunks.append({
                "id": str(r["id"]),
                "content": r["content"],
                "filename": r["filename"],
                "page_number": None,
                "token_count": max(1, len(r["content"].split())),
                "cosine_similarity": 0.0,
                "is_real_chunk": False,
            })

    # Step 5: Budget-trim — greedily take chunks in relevance order until token budget exhausted
    budget = settings.context_material_token_budget
    context_chunks: list[dict] = []
    tokens_used = 0
    for chunk in chunks:
        t = chunk["token_count"] or max(1, len(chunk["content"].split()))
        if tokens_used + t > budget:
            break
        context_chunks.append(chunk)
        tokens_used += t

    # Step 6: Build grounded system prompt — number real chunks so AI can cite them inline
    # Track citation number per chunk so saved citation_order matches what the model sees
    personality_instruction = _PERSONALITY_INSTRUCTIONS.get(personality, _PERSONALITY_INSTRUCTIONS["supportive"])
    citation_chunks = []  # (chunk, cite_num) pairs — built while constructing the prompt
    if context_chunks:
        materials_parts = []
        cite_num = 1
        for c in context_chunks:
            if c["is_real_chunk"]:
                header = f"[{cite_num}] {c.get('filename', 'Document')} (Page {c['page_number'] or '?'})"
                citation_chunks.append((c, cite_num))
                cite_num += 1
            else:
                header = f"[Ref] {c.get('filename', 'Document')}"
            materials_parts.append(f"{header}:\n{c['content']}")
        materials = "\n\n".join(materials_parts)
        system_prompt = (
            f"You are an AI teaching assistant. {personality_instruction} "
            "Answer the student's question using ONLY the following numbered course materials. "
            "Whenever you use information from a source, place its citation number inline in your answer like [1] or [2]. "
            "If the answer cannot be found in the materials, say so clearly — do not use outside knowledge.\n\n"
            f"--- Course Materials ---\n{materials}\n---"
        )
    else:
        system_prompt = (
            f"You are an AI teaching assistant. {personality_instruction} "
            "No course materials are currently available for this session. "
            "Let the student know their question cannot be answered from course materials right now."
        )

    # Step 6.5: Fetch prior Q&A history for this student in this session (last 5, oldest first)
    history_rows = await db.fetch(
        """
        SELECT q.content AS question, a.content AS answer
        FROM questions q
        JOIN answers a ON a.question_id = q.id
        WHERE q.session_id = $1 AND q.student_id = $2
          AND q.id != $3::uuid
        ORDER BY q.asked_at DESC
        LIMIT 5
        """,
        session_id,
        student_id,
        question_id,
    )
    history: list[dict] = []
    for row in reversed(history_rows):
        history.append({"role": "user", "content": row["question"]})
        history.append({"role": "assistant", "content": row["answer"]})

    # Step 7: Call GPT-4o — unpack 3-tuple (text, latency_ms, (input_tokens, output_tokens))
    answer_text, latency_ms, (input_tokens, output_tokens) = await asyncio.to_thread(
        openai_client.get_chat_completion,
        system_prompt,
        content,
        settings.max_answer_tokens,
        history or None,
    )

    # Step 8: Save answer with token counts
    a_row = await db.fetchrow(
        """
        INSERT INTO answers (question_id, content, model_used, generation_latency_ms, input_tokens, output_tokens)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        """,
        question_id,
        answer_text,
        openai_client.CHAT_MODEL,
        latency_ms,
        input_tokens or None,
        output_tokens or None,
    )
    answer_id = str(a_row["id"])

    # Step 8.5: Classify question category (fire-and-forget, don't block)
    try:
        category = await asyncio.to_thread(openai_client.classify_question, content)
        await db.execute(
            "UPDATE questions SET category = $1 WHERE id = $2",
            category,
            question_id,
        )
    except Exception:
        pass

    # Step 9: Save citations — use the exact cite_num assigned in the prompt so [n] always resolves
    citation_outs = []
    for chunk, cite_num in citation_chunks:
        await db.execute(
            """
            INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order)
            VALUES ($1, $2, $3, $4)
            """,
            answer_id,
            str(chunk["id"]),
            float(chunk["cosine_similarity"]),
            cite_num,
        )
        citation_outs.append(CitationOut(
            chunk_id=str(chunk["id"]),
            content=chunk["content"],
            page_number=chunk["page_number"],
            relevance_score=round(float(chunk["cosine_similarity"]), 4),
            citation_order=cite_num,
            filename=chunk.get("filename"),
            document_id=str(chunk["document_id"]) if chunk.get("document_id") else None,
        ))

    # Step 10: Return full QuestionOut
    return QuestionOut(
        question_id=question_id,
        content=content,
        asked_at=q_row["asked_at"],
        student_id=student_id,
        anonymous=anonymous,
        answer=AnswerOut(
            answer_id=answer_id,
            content=answer_text,
            model_used=openai_client.CHAT_MODEL,
            generation_latency_ms=latency_ms,
            citations=citation_outs,
        ),
    )
