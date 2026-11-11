-- Adds suggested answers, stable question ordering, and user practice records.
-- The ordering backfill runs before NOT NULL is enforced; all changes are transactional.
BEGIN;

ALTER TABLE interview_questions
    ADD COLUMN IF NOT EXISTS suggested_answer TEXT,
    ADD COLUMN IF NOT EXISTS question_order INTEGER;

-- Hibernate may have already added a nullable or partially constrained column.
-- Remove only the ordering constraint/index while existing values are normalized.
ALTER TABLE interview_questions ALTER COLUMN question_order DROP NOT NULL;
ALTER TABLE interview_questions ALTER COLUMN question_order DROP DEFAULT;
ALTER TABLE interview_questions DROP CONSTRAINT IF EXISTS uq_interview_questions_session_order;
DROP INDEX IF EXISTS uq_interview_questions_session_order;

WITH ranked AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY interview_session_id ORDER BY id) AS row_num
    FROM interview_questions
)
UPDATE interview_questions q
SET question_order = ranked.row_num
FROM ranked
WHERE q.id = ranked.id;

ALTER TABLE interview_questions ALTER COLUMN question_order SET NOT NULL;
ALTER TABLE interview_questions
    ADD CONSTRAINT uq_interview_questions_session_order UNIQUE (interview_session_id, question_order);

CREATE TABLE IF NOT EXISTS question_practice_answers (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL UNIQUE REFERENCES interview_questions(id) ON DELETE CASCADE,
    answer_text TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- Preserve progress already recorded under the former status values.
UPDATE interview_sessions s
SET status = CASE
    WHEN status = 'NOT_STARTED' AND EXISTS (
        SELECT 1 FROM interview_questions q WHERE q.interview_session_id = s.id
    ) THEN 'QUESTIONS_GENERATED'
    WHEN status = 'NOT_STARTED' THEN 'CREATED'
    ELSE status
END
WHERE status = 'NOT_STARTED';

ALTER TABLE interview_sessions ALTER COLUMN status SET DEFAULT 'CREATED';

COMMIT;
