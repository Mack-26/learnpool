-- Migration 005: add 'upcoming' value to session_status enum
ALTER TYPE session_status ADD VALUE IF NOT EXISTS 'upcoming';
