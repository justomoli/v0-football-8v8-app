-- Reset de datos de juego y deja solo jugadores kriko y justo (comparación case-insensitive).
-- Ejecutar en Supabase → SQL Editor (revisar antes en producción).

BEGIN;

-- 1) Quitar referencias de temporada a jugadores
UPDATE seasons SET
  top_scorer_id = NULL,
  top_scorer_goals = NULL,
  best_rating_id = NULL,
  best_rating_value = NULL,
  top_motm_id = NULL,
  top_motm_count = NULL;

-- 2) Partidos y estadísticas ligadas
DELETE FROM match_stats;
DELETE FROM matches;

-- 3) Historial de ratings y alias
DELETE FROM player_ratings;
DELETE FROM player_aliases;

-- 4) Sesiones
DELETE FROM sessions;

-- 5) Solo conservar kriko y justo
DELETE FROM players
WHERE lower(btrim(name)) NOT IN ('kriko', 'justo');

-- 6) Asegurar que existan ambos (nombres en minúsculas si faltaban)
INSERT INTO players (name, dynamic_rating, total_goals, total_matches, motm_count, is_admin)
SELECT v.name, 5.0, 0, 0, 0, false
FROM (VALUES ('kriko'), ('justo')) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM players p WHERE lower(btrim(p.name)) = v.name
);

-- 7) Estado del armado actual
UPDATE current_match_setup SET
  confirmed_players = ARRAY[]::uuid[],
  white_team = ARRAY[]::uuid[],
  black_team = ARRAY[]::uuid[],
  updated_at = NOW();

-- 8) Contadores base en los que quedan (opcional: partida limpia)
UPDATE players SET
  total_goals = 0,
  total_matches = 0,
  motm_count = 0,
  dynamic_rating = 5.0,
  updated_at = NOW()
WHERE lower(btrim(name)) IN ('kriko', 'justo');

COMMIT;
