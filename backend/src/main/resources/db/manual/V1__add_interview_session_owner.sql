-- PostgreSQL ownership migration.
--
-- Run after the authentication schema (app_users) exists. Existing rows keep
-- owner_id = NULL so they are not assigned to an arbitrary account. The
-- application scopes all reads and writes to an authenticated owner.
ALTER TABLE interview_sessions
    ADD COLUMN IF NOT EXISTS owner_id BIGINT;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint constraint_row
        JOIN pg_attribute column_row
          ON column_row.attrelid = constraint_row.conrelid
         AND column_row.attnum = ANY (constraint_row.conkey)
        WHERE constraint_row.contype = 'f'
          AND constraint_row.conrelid = 'interview_sessions'::regclass
          AND constraint_row.confrelid = 'app_users'::regclass
          AND column_row.attname = 'owner_id'
    ) THEN
        ALTER TABLE interview_sessions
            ADD CONSTRAINT fk_interview_sessions_owner
            FOREIGN KEY (owner_id) REFERENCES app_users (id);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_interview_sessions_owner_created
    ON interview_sessions (owner_id, created_at DESC);

CREATE OR REPLACE FUNCTION require_interview_session_owner()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.owner_id IS NULL THEN
        RAISE EXCEPTION 'Interview session owner is required.'
            USING ERRCODE = '23502';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_interview_sessions_require_owner ON interview_sessions;
CREATE TRIGGER trg_interview_sessions_require_owner
    BEFORE INSERT OR UPDATE OF owner_id ON interview_sessions
    FOR EACH ROW
    EXECUTE FUNCTION require_interview_session_owner();
