import asyncio

import asyncpg
import numpy as np

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
    """Full 9-step RAG pipeline: save question → embed → retrieve → generate → save answer+citations → return."""

    # Step 1: Save question (published=true — always shared with professor)
    q_row = await db.fetchrow(
        "INSERT INTO questions (session_id, student_id, content, anonymous, published) VALUES ($1, $2, $3, $4, true) RETURNING id, asked_at",
        session_id,
        student_id,
        content,
        anonymous,
    )
    question_id = str(q_row["id"])

    # Step 2: Embed the question (sync OpenAI SDK → run in thread pool)
    query_embedding = await asyncio.to_thread(openai_client.get_embedding, content)

    # Step 3: Get active document IDs for this session
    doc_rows = await db.fetch(
        "SELECT document_id FROM session_documents WHERE session_id = $1 AND is_active = true",
        session_id,
    )
    active_doc_ids = [str(r["document_id"]) for r in doc_rows]

    # Step 4a: Fetch ALL chunks from all active session documents (full context)
    all_chunks = []
    if active_doc_ids:
        all_chunk_rows = await db.fetch(
            """
            SELECT dc.id, dc.content, dc.page_number, d.filename
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE dc.document_id = ANY($1::uuid[])
            ORDER BY d.filename, dc.chunk_index
            """,
            active_doc_ids,
        )
        all_chunks = [dict(r) for r in all_chunk_rows]
        # Fallback: include documents with content but no chunks (e.g. inline text)
        doc_content_rows = await db.fetch(
            """
            SELECT d.filename, d.content
            FROM documents d
            WHERE d.id = ANY($1::uuid[]) AND d.content IS NOT NULL AND trim(d.content) != ''
            """,
            active_doc_ids,
        )
        docs_with_content = {r["filename"]: r["content"] for r in doc_content_rows}
        docs_with_chunks = {c.get("filename") for c in all_chunks}
        for filename, content in docs_with_content.items():
            if filename not in docs_with_chunks:
                all_chunks.append({"content": content, "filename": filename, "page_number": None})
        all_chunks.sort(key=lambda c: (c.get("filename", ""), c.get("page_number") or 0))

    # Step 4b: Vector similarity search for top 5 chunks (used for citations)
    chunks = []
    if active_doc_ids:
        embedding_vec = np.array(query_embedding, dtype=np.float32)
        chunk_rows = await db.fetch(
            """
            SELECT dc.id, dc.content, dc.page_number,
                   1 - (dc.embedding <=> $2) AS cosine_similarity
            FROM document_chunks dc
            WHERE dc.document_id = ANY($1::uuid[])
              AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> $2
            LIMIT 5
            """,
            active_doc_ids,
            embedding_vec,
        )
        chunks = [dict(r) for r in chunk_rows]

    # Step 5: Build grounded system prompt (use ALL chunks for full context)
    personality_instruction = _PERSONALITY_INSTRUCTIONS.get(personality, _PERSONALITY_INSTRUCTIONS["supportive"])
    if all_chunks:
        materials = "\n\n".join(
            f"[{c.get('filename', 'Doc')}] (Page {c['page_number'] or '?'}):\n{c['content']}"
            for c in all_chunks
        )
        system_prompt = (
            f"You are an AI teaching assistant. {personality_instruction} "
            "Answer the student's question using ONLY the following course materials from the posted files. "
            "You have access to the full content of all documents. Use this context to give accurate, comprehensive answers. "
            "If the answer cannot be found in the materials, say so clearly - do not use outside knowledge.\n\n"
            f"--- Course Materials (all posted files) ---\n{materials}\n---"
        )
    else:
        system_prompt = (
            f"You are an AI teaching assistant. {personality_instruction} "
            "No course materials are currently available for this session. "
            "Let the student know their question cannot be answered from course materials right now."
        )

    # Step 6: Call GPT-4o (sync → thread pool)
    answer_text, latency_ms = await asyncio.to_thread(
        openai_client.get_chat_completion, system_prompt, content
    )

    # Step 7: Save answer
    a_row = await db.fetchrow(
        """
        INSERT INTO answers (question_id, content, model_used, generation_latency_ms)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        """,
        question_id,
        answer_text,
        openai_client.CHAT_MODEL,
        latency_ms,
    )
    answer_id = str(a_row["id"])

    # Step 8: Save citations
    citation_outs = []
    for i, chunk in enumerate(chunks):
        await db.execute(
            """
            INSERT INTO answer_citations (answer_id, chunk_id, relevance_score, citation_order)
            VALUES ($1, $2, $3, $4)
            """,
            answer_id,
            str(chunk["id"]),
            float(chunk["cosine_similarity"]),
            i + 1,
        )
        citation_outs.append(CitationOut(
            chunk_id=str(chunk["id"]),
            content=chunk["content"],
            page_number=chunk["page_number"],
            relevance_score=round(float(chunk["cosine_similarity"]), 4),
            citation_order=i + 1,
        ))

    # Step 9: Return full QuestionOut
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
