import asyncio

import asyncpg

from models import AnswerOut, CitationOut, QuestionOut
from services import openai_client


async def handle_question(
    session_id: str,
    student_id: str,
    content: str,
    db: asyncpg.Connection,
) -> QuestionOut:
    """Full 9-step RAG pipeline: save question → embed → retrieve → generate → save answer+citations → return."""

    # Step 1: Save question
    q_row = await db.fetchrow(
        "INSERT INTO questions (session_id, student_id, content) VALUES ($1, $2, $3) RETURNING id, asked_at",
        session_id,
        student_id,
        content,
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

    # Step 4: Vector similarity search against active chunks
    chunks = []
    if active_doc_ids:
        embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
        chunk_rows = await db.fetch(
            """
            SELECT dc.id, dc.content, dc.page_number,
                   1 - (dc.embedding <=> $2::vector) AS cosine_similarity
            FROM document_chunks dc
            WHERE dc.document_id = ANY($1::uuid[])
              AND dc.embedding IS NOT NULL
            ORDER BY dc.embedding <=> $2::vector
            LIMIT 5
            """,
            active_doc_ids,
            embedding_str,
        )
        chunks = [dict(r) for r in chunk_rows]

    # Step 5: Build grounded system prompt
    if chunks:
        materials = "\n".join(
            f"[{i + 1}] (Page {c['page_number'] or '?'}): {c['content']}"
            for i, c in enumerate(chunks)
        )
        system_prompt = (
            "You are an AI teaching assistant. Answer the student's question using ONLY "
            "the following course materials. If the answer cannot be found in the materials, "
            "say so clearly — do not use outside knowledge.\n\n"
            f"--- Course Materials ---\n{materials}\n---"
        )
    else:
        system_prompt = (
            "You are an AI teaching assistant. No course materials are currently available "
            "for this session. Let the student know their question cannot be answered from "
            "course materials right now."
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
        answer=AnswerOut(
            answer_id=answer_id,
            content=answer_text,
            model_used=openai_client.CHAT_MODEL,
            generation_latency_ms=latency_ms,
            citations=citation_outs,
        ),
    )
