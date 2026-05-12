-- Migration 006: Add editable bio field to players
-- Run in Supabase SQL editor.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS bio TEXT;
