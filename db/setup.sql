-- Applies the schema and seeds demo data.
-- Run with: psql "$DATABASE_URL" -f db/setup.sql
--
-- This script runs on EVERY app start and EVERY deploy, so everything in it
-- must be IDEMPOTENT (safe to re-run): guarded CREATEs, and seeds that no-op
-- when data already exists.
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed only an EMPTY table — re-runs add nothing, and a user who deleted the
-- demo notes doesn't get them back.
INSERT INTO notes (title, content)
SELECT v.title, v.content
FROM (VALUES
  ('Welcome', 'This note was seeded into your Postgres database.'),
  ('It works', 'If you can see this on the DB page, Postgres is connected.')
) AS v(title, content)
WHERE NOT EXISTS (SELECT 1 FROM notes);
