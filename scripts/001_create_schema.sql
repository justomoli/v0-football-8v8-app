-- Futbol 8 Manager Database Schema
-- This schema supports: players, matches, seasons, match_stats, and aliases for name normalization

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  dynamic_rating DECIMAL(3,1) NOT NULL DEFAULT 5.0 CHECK (dynamic_rating >= 1 AND dynamic_rating <= 10),
  total_goals INTEGER NOT NULL DEFAULT 0,
  total_matches INTEGER NOT NULL DEFAULT 0,
  motm_count INTEGER NOT NULL DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Player ratings history (for calculating dynamic averages)
CREATE TABLE IF NOT EXISTS player_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  rating DECIMAL(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
  match_id UUID, -- optional reference to match
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_ratings_player ON player_ratings(player_id);

-- Player aliases for name normalization (Nico -> Nicolas, etc)
CREATE TABLE IF NOT EXISTS player_aliases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alias)
);

CREATE INDEX IF NOT EXISTS idx_player_aliases_alias ON player_aliases(alias);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  top_scorer_id UUID REFERENCES players(id),
  top_scorer_goals INTEGER,
  best_rating_id UUID REFERENCES players(id),
  best_rating_value DECIMAL(3,1),
  top_motm_id UUID REFERENCES players(id),
  top_motm_count INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  white_score INTEGER NOT NULL DEFAULT 0,
  black_score INTEGER NOT NULL DEFAULT 0,
  white_team UUID[] NOT NULL DEFAULT '{}',
  black_team UUID[] NOT NULL DEFAULT '{}',
  is_special_event BOOLEAN NOT NULL DEFAULT FALSE,
  motm_player_id UUID REFERENCES players(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season_id);

-- Match stats (individual player stats per match)
CREATE TABLE IF NOT EXISTS match_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  goals_scored INTEGER NOT NULL DEFAULT 0,
  match_rating DECIMAL(3,1) NOT NULL DEFAULT 5.0 CHECK (match_rating >= 1 AND match_rating <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(match_id, player_id)
);

CREATE INDEX IF NOT EXISTS idx_match_stats_match ON match_stats(match_id);
CREATE INDEX IF NOT EXISTS idx_match_stats_player ON match_stats(player_id);

-- Session tracking for "logged in" player (simple approach without password)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id);

-- Current match setup (temporary state)
CREATE TABLE IF NOT EXISTS current_match_setup (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  confirmed_players UUID[] NOT NULL DEFAULT '{}',
  white_team UUID[] NOT NULL DEFAULT '{}',
  black_team UUID[] NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for players updated_at
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for current_match_setup updated_at
DROP TRIGGER IF EXISTS update_current_match_setup_updated_at ON current_match_setup;
CREATE TRIGGER update_current_match_setup_updated_at
  BEFORE UPDATE ON current_match_setup
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert initial match setup row (singleton)
INSERT INTO current_match_setup (id) 
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
