ALTER TABLE expense_rounds ADD COLUMN public_token TEXT UNIQUE;

-- backfill existing rounds with a share token (sha256 is a core Postgres function — no
-- pgcrypto extension needed).
UPDATE expense_rounds
SET public_token = encode(sha256((random()::text || clock_timestamp()::text || id::text)::bytea), 'hex')
WHERE public_token IS NULL;

ALTER TABLE expense_rounds ALTER COLUMN public_token SET NOT NULL;
