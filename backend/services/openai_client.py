import json
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


def cluster_questions_by_topic(questions: list[dict]) -> list[dict]:
    """Group questions into topic clusters using GPT-4o-mini.

    Input:  [{"question_id": str, "content": str}, ...]
    Output: [{"topic_name": str, "question_ids": [str, ...]}, ...]

    Falls back to a single "General" group on any error.
    """
    if not questions:
        return []
    if len(questions) == 1:
        return [{"topic_name": "General", "question_ids": [questions[0]["question_id"]]}]

    lines = "\n".join(f'[{q["question_id"]}] {q["content"]}' for q in questions)
    prompt = (
        "You are grouping student questions from a university lecture into topic clusters.\n\n"
        f"Questions:\n{lines}\n\n"
        "Group them into 2–6 meaningful topic clusters based on the concept being asked about.\n"
        "Rules:\n"
        "- Every question must appear in exactly one group.\n"
        "- Topic names must be concise (2–4 words), e.g. 'Learning Rate', 'MSE Cost Function'.\n"
        "- Return ONLY valid JSON matching this exact shape — no prose, no markdown:\n"
        '{"groups":[{"topic_name":"...","question_ids":["id1","id2"]}]}'
    )
    try:
        response = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        return data.get("groups", [])
    except Exception:
        # Graceful fallback: single group with all questions
        return [{"topic_name": "General", "question_ids": [q["question_id"] for q in questions]}]
