-- Migration 003: add content column to documents for inline text documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS content TEXT;
