"""
One-off script: embed the 3 seed document_chunks that have NULL embeddings.
Run once after `make db-seed`, before testing the RAG pipeline.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/embed_seed_chunks.py
"""

import asyncio
import os
import sys

import asyncpg
from dotenv import load_dotenv
from openai import OpenAI
from pgvector.asyncpg import register_vector

load_dotenv()

DATABASE_URL = os.environ["DATABASE_URL"]
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
EMBEDDING_MODEL = "text-embedding-3-small"


async def main():
    client = OpenAI(api_key=OPENAI_API_KEY)

    conn = await asyncpg.connect(DATABASE_URL)
    await register_vector(conn)

    rows = await conn.fetch(
        "SELECT id, chunk_index, content FROM document_chunks WHERE embedding IS NULL ORDER BY chunk_index"
    )

    if not rows:
        print("All chunks already have embeddings — nothing to do.")
        await conn.close()
        return

    print(f"Embedding {len(rows)} chunk(s)...")

    for row in rows:
        text = row["content"].replace("\n", " ").strip()
        response = client.embeddings.create(input=text, model=EMBEDDING_MODEL)
        embedding = response.data[0].embedding
        embedding_str = "[" + ",".join(map(str, embedding)) + "]"

        await conn.execute(
            "UPDATE document_chunks SET embedding = $1::vector, embedding_model = $2 WHERE id = $3",
            embedding_str,
            EMBEDDING_MODEL,
            row["id"],
        )
        print(f"  ✓ chunk id={row['id']}  chunk_index={row['chunk_index']}")

    await conn.close()
    print("\nDone. All seed chunks now have embeddings.")


if __name__ == "__main__":
    asyncio.run(main())
