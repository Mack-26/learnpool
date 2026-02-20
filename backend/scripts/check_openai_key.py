"""
Verify OpenAI API key from .env works.
Run from backend/:  python scripts/check_openai_key.py
"""

import sys
from pathlib import Path

# Add backend/ to path so config loads .env from backend/
_backend = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_backend))

from config import settings
from openai import OpenAI


def main():
    key = settings.openai_api_key
    if not key or key == "sk-...":
        print("ERROR: OPENAI_API_KEY not loaded or still placeholder")
        return 1

    print(f"Key loaded: {key[:12]}...{key[-4:]}")
    client = OpenAI(api_key=key)

    try:
        # Minimal call: embeddings for a single short string
        r = client.embeddings.create(input="test", model="text-embedding-3-small")
        dim = len(r.data[0].embedding)
        print(f"OK: Embedding API works (dim={dim})")
        return 0
    except Exception as e:
        print(f"ERROR: {e}")
        return 1


if __name__ == "__main__":
    sys.exit(main())
