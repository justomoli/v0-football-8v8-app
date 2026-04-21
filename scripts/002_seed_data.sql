-- Seed data for Futbol 8 Manager

-- Insert sample players
INSERT INTO players (id, name, dynamic_rating, total_goals, total_matches, motm_count, is_admin) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Messi', 9.5, 12, 8, 3, TRUE),
  ('22222222-2222-2222-2222-222222222222', 'Ronaldo', 9.2, 10, 8, 2, FALSE),
  ('33333333-3333-3333-3333-333333333333', 'Neymar', 8.8, 8, 7, 1, FALSE),
  ('44444444-4444-4444-4444-444444444444', 'Mbappé', 8.5, 7, 8, 1, FALSE),
  ('55555555-5555-5555-5555-555555555555', 'De Bruyne', 8.3, 4, 8, 1, FALSE),
  ('66666666-6666-6666-6666-666666666666', 'Haaland', 8.7, 9, 6, 0, FALSE),
  ('77777777-7777-7777-7777-777777777777', 'Salah', 8.1, 6, 8, 0, FALSE),
  ('88888888-8888-8888-8888-888888888888', 'Modric', 7.9, 2, 8, 0, FALSE),
  ('99999999-9999-9999-9999-999999999999', 'Kroos', 7.8, 3, 7, 0, FALSE),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Bellingham', 8.4, 5, 6, 0, FALSE)
ON CONFLICT (name) DO NOTHING;

-- Insert initial ratings history for each player
INSERT INTO player_ratings (player_id, rating) VALUES
  ('11111111-1111-1111-1111-111111111111', 9.5),
  ('22222222-2222-2222-2222-222222222222', 9.2),
  ('33333333-3333-3333-3333-333333333333', 8.8),
  ('44444444-4444-4444-4444-444444444444', 8.5),
  ('55555555-5555-5555-5555-555555555555', 8.3),
  ('66666666-6666-6666-6666-666666666666', 8.7),
  ('77777777-7777-7777-7777-777777777777', 8.1),
  ('88888888-8888-8888-8888-888888888888', 7.9),
  ('99999999-9999-9999-9999-999999999999', 7.8),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 8.4);

-- Insert some player aliases for name normalization
INSERT INTO player_aliases (player_id, alias) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Leo'),
  ('11111111-1111-1111-1111-111111111111', 'Lionel'),
  ('22222222-2222-2222-2222-222222222222', 'CR7'),
  ('22222222-2222-2222-2222-222222222222', 'Cristiano'),
  ('33333333-3333-3333-3333-333333333333', 'Ney'),
  ('44444444-4444-4444-4444-444444444444', 'Kylian'),
  ('55555555-5555-5555-5555-555555555555', 'Kevin'),
  ('55555555-5555-5555-5555-555555555555', 'KDB'),
  ('66666666-6666-6666-6666-666666666666', 'Erling'),
  ('88888888-8888-8888-8888-888888888888', 'Luka'),
  ('99999999-9999-9999-9999-999999999999', 'Toni'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Jude')
ON CONFLICT (alias) DO NOTHING;

-- Insert initial season
INSERT INTO seasons (id, name, status, start_date) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Apertura 2026', 'active', NOW())
ON CONFLICT DO NOTHING;
