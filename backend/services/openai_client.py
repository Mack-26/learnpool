import time

from openai import OpenAI

from config import settings

_client = OpenAI(api_key=settings.openai_api_key)

EMBEDDING_MODEL = "text-embedding-3-small"
CHAT_MODEL = "gpt-4o"


def get_embedding(text: str) -> list[float]:
    """Return the 1536-dim embedding for text using text-embedding-3-small.

    Called via asyncio.to_thread() from async routes — the OpenAI SDK is sync.
    """
    cleaned = text.replace("\n", " ").strip()
    response = _client.embeddings.create(input=cleaned, model=EMBEDDING_MODEL)
    return response.data[0].embedding


def get_chat_completion(system_prompt: str, user_message: str) -> tuple[str, int]:
    """Call GPT-4o and return (answer_text, latency_ms).

    Called via asyncio.to_thread() from async routes.
    """
    start = time.perf_counter()
    response = _client.chat.completions.create(
        model=CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message},
        ],
        temperature=0.2,
    )
    latency_ms = int((time.perf_counter() - start) * 1000)
    content = response.choices[0].message.content or ""
    return content, latency_ms
