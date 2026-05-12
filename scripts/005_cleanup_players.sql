-- Migration 005: Cleanup demo players, keep only Justo and Kriko
-- ⚠ DESTRUCTIVO: borra match_stats, player_ratings y aliases de los demos por cascade.
-- Asume que los datos actuales son seed/demo y no producción.
-- Corré primero el SELECT para confirmar los nombres exactos antes del DELETE.

-- 1) Revisar qué hay
-- SELECT id, name, is_admin, total_matches FROM players ORDER BY name;

-- 2) Asegurar que Justo y Kriko existen (idempotente)
INSERT INTO players (name, dynamic_rating, is_admin)
VALUES
  ('Justo', 7.0, true),
  ('Kriko', 7.0, true)
ON CONFLICT (name) DO NOTHING;

-- 3) Borrar todo lo demás
-- (LOWER() para tolerancia a mayúsculas; incluir alias frecuentes por las dudas)
DELETE FROM players
WHERE LOWER(name) NOT IN (
  'justo',
  'kriko',
  'justo moli',
  'mateo',
  'mateo krikorian'
);

-- 4) Limpiar el setup de partido actual (si quedó algo)
UPDATE current_match_setup
SET confirmed_players = '{}',
    white_team = '{}',
    black_team = '{}'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- 5) Verificar
SELECT id, name, is_admin, dynamic_rating FROM players ORDER BY name;
