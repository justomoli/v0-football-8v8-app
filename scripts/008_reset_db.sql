-- 008_reset_db.sql
-- Reset total para empezar a probar desde cero.
-- Mantiene: players (id + name + is_admin).
-- Borra: matches, match_stats, player_ratings, seasons, sessions, aliases.
-- Resetea perfil + stats + GK + foto + bio + nickname + medidas/posición.
-- Vacía current_match_setup. Crea una temporada activa nueva.

BEGIN;

-- 1) Wipe historial y datos efímeros
--    match_stats y matches caen en cascada al borrar seasons (FK ON DELETE CASCADE),
--    pero los limpiamos explícito por orden y seguridad.
DELETE FROM player_ratings;
DELETE FROM sessions;
DELETE FROM player_aliases;
DELETE FROM seasons;

-- 2) Vaciar setup de próximo partido
UPDATE current_match_setup
SET
  confirmed_players = '{}',
  white_team = '{}',
  black_team = '{}',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 3) Reset perfil + stats de todos los jugadores
UPDATE players
SET
  total_goals = 0,
  total_matches = 0,
  motm_count = 0,
  dynamic_rating = 5.0,
  is_goalkeeper = FALSE,
  bio = NULL,
  photo_url = NULL,
  nickname = NULL,
  height_cm = NULL,
  weight_kg = NULL,
  position = NULL,
  shot = NULL,
  pace = NULL,
  passing = NULL,
  dribbling = NULL,
  defense = NULL,
  physique = NULL,
  updated_at = NOW();

-- 4) Re-sembrar rating inicial (para que el avg arranque en 5.0)
INSERT INTO player_ratings (player_id, rating)
SELECT id, 5.0 FROM players;

-- 5) Temporada activa nueva
INSERT INTO seasons (name, status)
VALUES ('Temporada ' || TO_CHAR(NOW(), 'YYYY'), 'active');

COMMIT;
