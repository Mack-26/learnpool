-- Clear all lecture/chat history (questions, answers, citations, feedback)
-- Run with: docker compose exec -T db psql -U learnpool -d learnpool < db/scripts/clear_lecture_history.sql

TRUNCATE TABLE
    answer_feedback,
    answer_citations,
    answers,
    questions
CASCADE;
