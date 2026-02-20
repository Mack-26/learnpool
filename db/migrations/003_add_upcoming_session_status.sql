-- Add 'upcoming' status for future/scheduled lectures
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'upcoming';
