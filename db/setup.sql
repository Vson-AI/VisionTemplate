-- Run with: createdb vision_template && psql -d vision_template -f db/setup.sql
CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO notes (title, content) VALUES
  ('Welcome', 'This note was seeded into your local Postgres database.'),
  ('It works', 'If you can see this on the DB page, Postgres is connected.');

-- ---------------------------------------------------------------------------
-- MPL Events — internal ops tool
-- events → members (sponsors / speakers / local champions) with onboarding
-- status, plus per-event documents and shared per-role onboarding resources.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT '',
  venue TEXT NOT NULL DEFAULT '',
  event_date DATE,
  status TEXT NOT NULL DEFAULT 'planning', -- planning | confirmed | complete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_members (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  role TEXT NOT NULL,                       -- sponsor | speaker | champion
  name TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',          -- org / talk title / focus area
  email TEXT NOT NULL DEFAULT '',
  onboarding TEXT NOT NULL DEFAULT 'invited', -- invited | confirmed | onboarding | ready
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_members_event_id_idx ON event_members(event_id);

CREATE TABLE IF NOT EXISTS event_documents (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_documents_event_id_idx ON event_documents(event_id);

-- Onboarding resources are shared across every event, keyed by role.
CREATE TABLE IF NOT EXISTS role_resources (
  id SERIAL PRIMARY KEY,
  role TEXT NOT NULL,                        -- sponsor | speaker | champion
  title TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  sort INTEGER NOT NULL DEFAULT 0
);

-- Seed once (only when there are no events yet) so restarts don't duplicate.
DO $$
DECLARE
  e1 INTEGER;
  e2 INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM events) THEN
    INSERT INTO events (name, city, venue, event_date, status)
      VALUES ('MPL Live: Austin', 'Austin, TX', 'Capital Factory', '2026-09-17', 'confirmed')
      RETURNING id INTO e1;
    INSERT INTO events (name, city, venue, event_date, status)
      VALUES ('MPL Live: New York', 'New York, NY', 'Convene Midtown', '2026-11-05', 'planning')
      RETURNING id INTO e2;

    INSERT INTO event_members (event_id, role, name, detail, email, onboarding) VALUES
      -- Austin sponsors
      (e1, 'sponsor', 'Lattice',        'Platinum sponsor',        'partners@lattice.com',   'ready'),
      (e1, 'sponsor', 'Deel',           'Gold sponsor',            'events@deel.com',        'ready'),
      (e1, 'sponsor', 'Culture Amp',    'Gold sponsor',            'brand@cultureamp.com',   'onboarding'),
      (e1, 'sponsor', 'Gusto',          'Silver sponsor',          'partners@gusto.com',     'confirmed'),
      (e1, 'sponsor', 'BambooHR',       'Silver sponsor',          'events@bamboohr.com',    'confirmed'),
      (e1, 'sponsor', 'Rippling',       'Booth sponsor',           'sponsor@rippling.com',   'invited'),
      -- Austin speakers
      (e1, 'speaker', 'Maya Robinson',  'CHRO, Northwind — "Rethinking Performance"', 'maya@northwind.co',  'ready'),
      (e1, 'speaker', 'Daniel Osei',    'VP People, Fathom — "Skills-based orgs"',    'daniel@fathom.io',   'ready'),
      (e1, 'speaker', 'Priya Nair',     'Head of Talent, Loop — "Hiring in 2026"',    'priya@loop.com',     'onboarding'),
      (e1, 'speaker', 'Tomás Vidal',    'People Ops Lead, Arc — "AI & HR"',           'tomas@arc.dev',      'onboarding'),
      (e1, 'speaker', 'Grace Lee',      'CPO, Meridian — "Manager enablement"',       'grace@meridian.com', 'confirmed'),
      (e1, 'speaker', 'Sam Whitfield',  'Founder, PeopleLab — Fireside chat',         'sam@peoplelab.io',   'invited'),
      (e1, 'speaker', 'Aisha Bello',    'Dir. of L&D, Vertex — "Growth cultures"',    'aisha@vertex.com',   'invited'),
      -- Austin local champions
      (e1, 'champion', 'Jordan Pierce', 'Austin community host',   'jordan.p@gmail.com',     'ready'),
      (e1, 'champion', 'Renee Carter',  'Venue & logistics',       'renee.c@gmail.com',      'onboarding'),
      (e1, 'champion', 'Kevin Tran',    'Outreach & turnout',      'kevin.tran@gmail.com',   'confirmed'),
      (e1, 'champion', 'Bianca Alvarez','Day-of volunteers',       'bianca.a@gmail.com',     'invited'),

      -- New York (early planning)
      (e2, 'sponsor',  'Lattice',       'Platinum sponsor',        'partners@lattice.com',   'confirmed'),
      (e2, 'sponsor',  'Workday',       'Gold sponsor',            'events@workday.com',     'invited'),
      (e2, 'speaker',  'Maya Robinson', 'CHRO, Northwind',         'maya@northwind.co',      'invited'),
      (e2, 'speaker',  'Leah Kim',      'VP People, Cobalt',       'leah@cobalt.com',        'invited'),
      (e2, 'champion', 'Marcus Reed',   'NYC community host',      'marcus.reed@gmail.com',  'confirmed');

    INSERT INTO event_documents (event_id, title, url) VALUES
      (e1, 'Run-of-show (Austin)',        'https://docs.example.com/austin/run-of-show'),
      (e1, 'Venue floor plan',            'https://docs.example.com/austin/floorplan'),
      (e1, 'Master budget',               'https://docs.example.com/austin/budget');
  END IF;
END $$;

INSERT INTO role_resources (role, title, url, sort)
SELECT * FROM (VALUES
  ('sponsor',  'Sponsor onboarding guide',       'https://docs.example.com/sponsor/guide',      1),
  ('sponsor',  'Logo & brand asset specs',       'https://docs.example.com/sponsor/assets',     2),
  ('sponsor',  'Booth & activation checklist',   'https://docs.example.com/sponsor/booth',      3),
  ('sponsor',  'Sponsorship agreement template', 'https://docs.example.com/sponsor/agreement',  4),
  ('speaker',  'Speaker prep guide',             'https://docs.example.com/speaker/guide',      1),
  ('speaker',  'Slide template & AV specs',      'https://docs.example.com/speaker/slides',     2),
  ('speaker',  'Headshot & bio submission',      'https://docs.example.com/speaker/bio',        3),
  ('speaker',  'Run-of-show & timing',           'https://docs.example.com/speaker/timing',     4),
  ('champion', 'Local champion playbook',        'https://docs.example.com/champion/playbook',  1),
  ('champion', 'Venue & logistics checklist',    'https://docs.example.com/champion/logistics', 2),
  ('champion', 'Community outreach toolkit',     'https://docs.example.com/champion/outreach',  3),
  ('champion', 'Day-of volunteer guide',         'https://docs.example.com/champion/volunteers',4)
) AS v(role, title, url, sort)
WHERE NOT EXISTS (SELECT 1 FROM role_resources);
