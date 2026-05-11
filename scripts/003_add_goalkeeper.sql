-- Migration 003: Add is_goalkeeper flag to players
-- Run this in your Supabase SQL editor before using the goalkeeper feature.

ALTER TABLE players
  ADD COLUMN IF NOT EXISTS is_goalkeeper BOOLEAN NOT NULL DEFAULT false;

-- Optional: index if you ever need to query by goalkeeper status
CREATE INDEX IF NOT EXISTS idx_players_is_goalkeeper
  ON players (is_goalkeeper) WHERE is_goalkeeper = true;
