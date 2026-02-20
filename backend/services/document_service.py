"""Process text documents: chunk, embed, and link to sessions."""

import asyncio
import re

from services import openai_client

EMBEDDING_MODEL = "text-embedding-3-small"
CHUNK_SIZE = 1500  # chars, ~400 tokens
CHUNK_OVERLAP = 150


def _chunk_text(text: str) -> list[tuple[str, int | None]]:
    """Split text into chunks. Returns [(chunk_text, page_number), ...]. Page is None for text docs."""
    text = text.strip()
    if not text:
        return []

    # Split by double newlines (paragraphs) first, then merge into chunks
    paragraphs = re.split(r'\n\s*\n', text)
    chunks: list[tuple[str, int | None]] = []
    current = []
    current_len = 0

    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        p_len = len(p) + 2  # +2 for \n\n
        if current_len + p_len > CHUNK_SIZE and current:
            chunk_text = "\n\n".join(current)
            chunks.append((chunk_text, None))
            # Overlap: keep last part of current
            overlap_text = current[-1]
            if len(overlap_text) > CHUNK_OVERLAP:
                current = [overlap_text[-CHUNK_OVERLAP:]]
                current_len = len(current[0])
            else:
                current = []
                current_len = 0
        current.append(p)
        current_len += p_len

    if current:
        chunks.append(("\n\n".join(current), None))
    return chunks


async def process_text_document(
    db,
    document_id: str,
    content: str,
) -> None:
    """
    Chunk the text, embed each chunk, insert into document_chunks, and set document to ready.
    """
    chunks = _chunk_text(content)
    if not chunks:
        return

    for i, (chunk_text, page_num) in enumerate(chunks):
        embedding = await asyncio.to_thread(
            openai_client.get_embedding,
            chunk_text.replace("\n", " ").strip(),
        )
        embedding_str = "[" + ",".join(map(str, embedding)) + "]"
        token_count = len(chunk_text.split())  # rough estimate

        await db.execute(
            """
            INSERT INTO document_chunks (document_id, chunk_index, page_number, content, token_count, embedding, embedding_model)
            VALUES ($1, $2, $3, $4, $5, $6::vector, $7)
            """,
            document_id,
            i,
            page_num,
            chunk_text,
            token_count,
            embedding_str,
            EMBEDDING_MODEL,
        )

    await db.execute(
        """
        UPDATE documents
        SET processing_status = 'ready', processed_at = now(), page_count = $2
        WHERE id = $1
        """,
        document_id,
        len(chunks),
    )
