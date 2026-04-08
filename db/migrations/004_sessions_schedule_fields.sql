-- Migration 004: add scheduling fields to sessions
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS location TEXT;
