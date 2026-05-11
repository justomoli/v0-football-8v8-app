-- Migration 004: Player profile fields for FIFA-style cards
-- Run in Supabase SQL editor before using the player detail card.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS height_cm INTEGER,
  ADD COLUMN IF NOT EXISTS weight_kg INTEGER,
  ADD COLUMN IF NOT EXISTS position TEXT,            -- 'GK' | 'DEF' | 'MID' | 'FWD'
  ADD COLUMN IF NOT EXISTS shot INTEGER,             -- 1-99
  ADD COLUMN IF NOT EXISTS pace INTEGER,
  ADD COLUMN IF NOT EXISTS passing INTEGER,
  ADD COLUMN IF NOT EXISTS dribbling INTEGER,
  ADD COLUMN IF NOT EXISTS defense INTEGER,
  ADD COLUMN IF NOT EXISTS physique INTEGER,
  ADD COLUMN IF NOT EXISTS photo_url TEXT,
  ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Optional check constraint for position
ALTER TABLE players
  DROP CONSTRAINT IF EXISTS players_position_check;
ALTER TABLE players
  ADD CONSTRAINT players_position_check
  CHECK (position IS NULL OR position IN ('GK', 'DEF', 'MID', 'FWD'));
