-- Run once in a dedicated Neon database before enabling the guestbook.
BEGIN;

CREATE TABLE IF NOT EXISTS guestbook_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  email text CHECK (char_length(email) <= 254),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 3000),
  visibility text NOT NULL CHECK (visibility IN ('private', 'public')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'hidden')),
  source text,
  reply text CHECK (char_length(reply) <= 3000),
  replied_at timestamptz,
  notification_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (visibility = 'public' OR (email IS NOT NULL AND email <> '')),
  CHECK (visibility = 'public' OR status <> 'approved'),
  CHECK (visibility = 'public' OR reply IS NULL)
);

CREATE INDEX IF NOT EXISTS guestbook_public_created
  ON guestbook_messages (created_at DESC, id DESC)
  WHERE visibility = 'public' AND status = 'approved';

-- Re-running this migration also upgrades existing installations. Do not invent
-- consent for old messages: their consent fields intentionally remain NULL.
ALTER TABLE guestbook_messages ADD COLUMN IF NOT EXISTS privacy_version text;
ALTER TABLE guestbook_messages ADD COLUMN IF NOT EXISTS consented_at timestamptz;
ALTER TABLE guestbook_messages ADD COLUMN IF NOT EXISTS website text CHECK (char_length(website) <= 2048);

-- Consent is immutable, including when a message is edited by an administrator.
CREATE OR REPLACE FUNCTION guestbook_preserve_visibility() RETURNS trigger AS $$
BEGIN
  IF NEW.visibility IS DISTINCT FROM OLD.visibility THEN
    RAISE EXCEPTION 'Guestbook visibility cannot be changed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS guestbook_visibility_immutable ON guestbook_messages;
CREATE TRIGGER guestbook_visibility_immutable
  BEFORE UPDATE ON guestbook_messages
  FOR EACH ROW EXECUTE FUNCTION guestbook_preserve_visibility();

-- Only salted hashes are stored here, never raw IP addresses.
CREATE TABLE IF NOT EXISTS guestbook_rate_limits (
  key text PRIMARY KEY,
  hits integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS guestbook_rate_expiry ON guestbook_rate_limits (expires_at);

COMMIT;
