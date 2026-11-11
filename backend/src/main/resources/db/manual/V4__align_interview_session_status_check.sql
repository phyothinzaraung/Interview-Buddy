-- Align the persisted status check with InterviewStatus.
-- Existing interview_sessions and their related questions are preserved.
-- Run this manual migration before deploying code that writes QUESTIONS_GENERATED.
BEGIN;

-- Fail before changing the schema if any status needs a deliberate mapping.
-- Known legacy NOT_STARTED rows are mapped below; current values are retained.
DO $$
DECLARE
    unexpected_statuses TEXT;
BEGIN
    SELECT string_agg(DISTINCT COALESCE(status, '<NULL>'), ', ' ORDER BY COALESCE(status, '<NULL>'))
      INTO unexpected_statuses
      FROM interview_sessions
     WHERE status IS NULL
        OR status NOT IN (
            'NOT_STARTED',
            'CREATED',
            'QUESTIONS_GENERATED',
            'IN_PROGRESS',
            'COMPLETED'
        );

    IF unexpected_statuses IS NOT NULL THEN
        RAISE EXCEPTION
            'Cannot migrate interview_sessions status check: unrecognized existing status value(s): %. No rows were changed.',
            unexpected_statuses;
    END IF;
END
$$;

-- Drop only the stale status check, then normalize the known retired value.
-- The surrounding transaction prevents writes from observing an unchecked state.
ALTER TABLE interview_sessions
    DROP CONSTRAINT IF EXISTS interview_sessions_status_check;

UPDATE interview_sessions s
   SET status = CASE
       WHEN EXISTS (
           SELECT 1
             FROM interview_questions q
            WHERE q.interview_session_id = s.id
       ) THEN 'QUESTIONS_GENERATED'
       ELSE 'CREATED'
   END
 WHERE s.status = 'NOT_STARTED';

ALTER TABLE interview_sessions
    ALTER COLUMN status SET DEFAULT 'CREATED';

ALTER TABLE interview_sessions
    ADD CONSTRAINT interview_sessions_status_check
    CHECK (status IN ('CREATED', 'QUESTIONS_GENERATED', 'IN_PROGRESS', 'COMPLETED'));

COMMIT;
