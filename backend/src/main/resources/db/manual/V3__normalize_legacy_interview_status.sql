-- Normalize the retired status in place. Existing interview sessions and questions are preserved.
-- Sessions with questions are ready to practice; sessions without questions remain CREATED.
UPDATE interview_sessions s
SET status = CASE
    WHEN EXISTS (
        SELECT 1 FROM interview_questions q WHERE q.interview_session_id = s.id
    ) THEN 'QUESTIONS_GENERATED'
    ELSE 'CREATED'
END
WHERE s.status = 'NOT_STARTED';

ALTER TABLE interview_sessions ALTER COLUMN status SET DEFAULT 'CREATED';
