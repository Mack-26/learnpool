# LearnPool Python API
# Build context: repo root
# Usage: docker build -t learnpool-api .

FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
