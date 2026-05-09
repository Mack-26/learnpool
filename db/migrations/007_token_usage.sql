-- Migration 007: Token usage logging on answers
-- Apply: make db-shell → \i /docker-entrypoint-initdb.d/007_token_usage.sql

ALTER TABLE answers
    ADD COLUMN IF NOT EXISTS input_tokens  INT DEFAULT NULL,
    ADD COLUMN IF NOT EXISTS output_tokens INT DEFAULT NULL;
