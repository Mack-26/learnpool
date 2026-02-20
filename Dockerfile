# LearnPool Python API — run in Docker
# Build: docker compose build app
# Run:   docker compose up app  (or make app-up)

FROM python:3.12-slim

WORKDIR /app

# Install dependencies first (better layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Application code
COPY app/ ./app/
COPY main.py .

# Default: run the API (override with docker compose run app <cmd>)
ENV PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
