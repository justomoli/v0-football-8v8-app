-- 009_wipe_db_reset_players.sql
-- Limpieza total de datos operativos; la tabla `players` conserva filas (id + name + is_admin).
-- Borra: temporadas, partidos, stats por partido, historial de ratings, sesiones (tokens), aliases.
-- Resetea: contadores y rating dinámico de cada jugador, perfil FIFA/bio/foto, arquero, setup actual.
-- Vuelve a crear: una fila de rating inicial (5.0) por jugador y una temporada activa nueva.
--
-- Ejecutar en Supabase SQL Editor (o psql). Revisá que no haya otra transacción abierta.

BEGIN;

-- 1) Tablas que referencian players sin depender de seasons/matches
DELETE FROM player_ratings;
DELETE FROM sessions;
DELETE FROM player_aliases;

-- 2) Temporadas: en cascada borra matches y match_stats (FK ON DELETE CASCADE)
DELETE FROM seasons;

-- 3) Setup del matchmaker (fila singleton)
UPDATE current_match_setup
SET
  confirmed_players = '{}',
  white_team = '{}',
  black_team = '{}',
  updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 4) Jugadores: mismos registros, “cero” en todo lo derivado / opcional
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

-- 5) Historial de ratings coherente con el reset (un punto base por jugador)
INSERT INTO player_ratings (player_id, rating)
SELECT id, 5.0
FROM players;

-- 6) Temporada nueva
INSERT INTO seasons (name, status)
VALUES ('Temporada ' || TO_CHAR(NOW(), 'YYYY'), 'active');

COMMIT;

-- ---------------------------------------------------------------------------
-- OPCIONAL — borrar también todos los jugadores (BD “vacía” salvo esquema).
-- Descomentá SOLO si querés eliminar filas de players. Luego tendrás que
-- volver a cargar plantel (parser / admin) y reinsertar la fila singleton de
-- current_match_setup si la borraste.
--
-- BEGIN;
-- DELETE FROM player_ratings;
-- DELETE FROM sessions;
-- DELETE FROM player_aliases;
-- DELETE FROM match_stats;
-- DELETE FROM matches;
-- DELETE FROM seasons;
-- DELETE FROM players;
-- DELETE FROM current_match_setup;
-- INSERT INTO current_match_setup (id)
-- VALUES ('00000000-0000-0000-0000-000000000001');
-- COMMIT;
