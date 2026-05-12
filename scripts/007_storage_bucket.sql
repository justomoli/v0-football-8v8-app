-- Migration 007: Storage bucket for player photos
-- Run in Supabase SQL editor.
-- Crea el bucket `player-photos` público + policies para read/write libres.

-- 1) Crear/actualizar bucket público
INSERT INTO storage.buckets (id, name, public)
VALUES ('player-photos', 'player-photos', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2) Drop policies anteriores (idempotente)
DROP POLICY IF EXISTS "Public read player photos" ON storage.objects;
DROP POLICY IF EXISTS "Public write player photos" ON storage.objects;
DROP POLICY IF EXISTS "Public update player photos" ON storage.objects;
DROP POLICY IF EXISTS "Public delete player photos" ON storage.objects;

-- 3) Lectura pública
CREATE POLICY "Public read player photos"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'player-photos');

-- 4) Escritura pública (sin auth — herramienta interna)
CREATE POLICY "Public write player photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'player-photos');

CREATE POLICY "Public update player photos"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'player-photos');

CREATE POLICY "Public delete player photos"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'player-photos');

-- 5) Verificar
-- SELECT id, name, public FROM storage.buckets WHERE id = 'player-photos';
