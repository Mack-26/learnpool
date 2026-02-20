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


def identify_repeating_questions(questions: list[dict]) -> list[dict]:
    """Identify groups of similar/repeating questions.

    Input:  [{"question_id": str, "content": str}, ...]
    Output: [{"summary": str, "question_ids": [str, ...], "count": int}, ...]
    Only returns groups with count >= 2.
    """
    if len(questions) < 2:
        return []

    lines = "\n".join(f'[{q["question_id"]}] {q["content"]}' for q in questions)
    prompt = (
        "You are analyzing student questions from a lecture to find REPEATING or SIMILAR questions.\n\n"
        f"Questions:\n{lines}\n\n"
        "Group questions that ask the SAME or VERY SIMILAR thing (different wording, same concept).\n"
        "Rules:\n"
        "- Only create groups with 2+ similar questions.\n"
        "- Each question can appear in at most one group.\n"
        "- For each group, write a short summary (5-10 words) of what they're asking.\n"
        "- Return ONLY valid JSON — no prose, no markdown:\n"
        '{"repeating_groups":[{"summary":"...","question_ids":["id1","id2"]}]}'
    )
    try:
        response = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        groups = data.get("repeating_groups", [])
        return [
            {**g, "count": len(g.get("question_ids", []))}
            for g in groups
            if len(g.get("question_ids", [])) >= 2
        ]
    except Exception:
        return []


def summarize_questions_for_dashboard(
    questions: list[dict],
    topic_groups: list[dict],
) -> dict:
    """Generate session summary and per-topic summaries for the professor dashboard.

    Input:  questions, topic_groups (from cluster_questions_by_topic)
    Output: {
        "session_summary": str,
        "topic_summaries": [{"topic_name": str, "summary": str, "question_count": int}],
        "hot_topics": [str]  # topic names with most questions, max 3
    }
    """
    if not questions:
        return {
            "session_summary": "",
            "topic_summaries": [],
            "hot_topics": [],
        }

    topic_lines = "\n".join(
        f"- {g.get('topic_name', '?')}: {len(g.get('question_ids', []))} questions"
        for g in topic_groups
    )
    question_sample = "\n".join(
        (q["content"][:100] + ("..." if len(q["content"]) > 100 else "")) for q in questions[:15]
    )
    if len(questions) > 15:
        question_sample += f"\n... and {len(questions) - 15} more questions"

    prompt = (
        "You are summarizing student questions from a university lecture for the professor.\n\n"
        f"Total questions: {len(questions)}\n\n"
        f"Topics (with question counts):\n{topic_lines}\n\n"
        f"Sample of questions:\n{question_sample}\n\n"
        "Provide:\n"
        "1. session_summary: A 2-4 sentence overview of what students are asking about. "
        "Highlight main themes and any patterns.\n"
        "2. topic_summaries: For each topic, a 1-sentence summary of what students asked.\n"
        "3. hot_topics: The top 1-3 topic names that had the most questions (by count).\n"
        "Return ONLY valid JSON:\n"
        '{"session_summary":"...","topic_summaries":[{"topic_name":"...","summary":"...","question_count":N}],"hot_topics":["..."]}'
    )
    try:
        response = _client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)
    except Exception:
        return {
            "session_summary": "",
            "topic_summaries": [],
            "hot_topics": [],
        }
