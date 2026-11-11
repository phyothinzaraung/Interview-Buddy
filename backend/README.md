# Backend local configuration

Copy `backend/.env.example` to `backend/.env`, then set the database password, OpenAI key, and a private JWT signing key. Generate a secret directly into an environment variable without printing it:

```sh
export JWT_SECRET_BASE64="$(openssl rand -base64 32)"
```

For persistent local use, store that generated value in the ignored `backend/.env` file or a secret manager. Keep the same value across restarts so existing access tokens remain verifiable. Run the backend with `backend/` as the working directory so Spring Boot loads `backend/.env`; `application.yml` imports the local `.env` file and `application.properties` maps `JWT_SECRET_BASE64` into the security configuration. The key must be standard Base64 encoding of at least 32 random bytes. Keep `.env` out of version control. In deployed environments, provide the same value through the runtime's secret/environment configuration. `APP_ALLOWED_ORIGIN` should be the exact trusted frontend origin.

The project does not yet use an automated migration framework. For an existing PostgreSQL database, inspect which manual migrations have already been applied before running the remaining files; do not rerun V1 or V2 on a database where their changes are already present. Stop the backend and back up the database before applying a migration. V1 adds user ownership; existing rows keep `owner_id = NULL` until explicitly mapped to their correct account. V2 adds ordered questions, suggested answers, and persisted practice-answer records while preserving existing questions. It assigns each existing question a sequential order within its session before applying `NOT NULL`, and restores the session/order uniqueness constraint in the same transaction. V3 converts legacy `NOT_STARTED` session statuses in place. V4 replaces the stale session status check and maps only the known legacy status in place. If the current status constraint rejects either `CREATED` or `QUESTIONS_GENERATED`, run V4 before any pending migration that writes those values; if V2 and V3 are already applied, run V4 on its own. Legacy questions have no suggested answer until regenerated or explicitly backfilled. Hibernate schema update remains enabled for other application tables; it does not perform the question-order data migration or update this check constraint.

To apply the question-order backfill from the `backend/` directory, run:

```sh
psql -h localhost -p 5432 -U postgres -d interview_buddy \
  -v ON_ERROR_STOP=1 \
  -f src/main/resources/db/manual/V2__interview_practice.sql
```

Use the same database host, name, and role configured by `DB_URL` and `DB_USERNAME` if they differ from these local defaults. The migration updates only `question_order` and related schema constraints; it does not delete question or practice-answer rows.

To align the interview status check when V4 is needed, run from the `backend/` directory:

```sh
psql -h localhost -p 5432 -U postgres -d interview_buddy \
  -v ON_ERROR_STOP=1 \
  -f src/main/resources/db/manual/V4__align_interview_session_status_check.sql
```

V4 retains all session data, maps `NOT_STARTED` based on whether its session has questions, and aborts before schema changes if it encounters another status value. Confirm the existing status counts and constraint definition first; use the database configured by `DB_URL` and `DB_USERNAME` if it differs from these defaults.

Interview practice APIs (all require authentication and are scoped to the authenticated session owner):

- `POST /api/interviews/{id}/questions/generate` generates ordered questions with suggested answers and appends them to existing questions.
- `GET /api/interviews/{id}/questions` returns ordered questions, suggested answers, and any saved practice answers/completion timestamps.
- `GET /api/interviews/{sessionId}/practice` returns the owned session, its questions, and current progress in one response.
- `GET /api/interviews/{sessionId}/questions/{questionId}/answer` retrieves the current saved answer (null fields mean not answered yet).
- `PUT /api/interviews/{sessionId}/questions/{questionId}/answer` saves or updates `{ "answerText": "..." }`.
- `POST /api/interviews/{sessionId}/questions/{questionId}/complete` marks a question practiced/completed.
- `GET /api/interviews/{sessionId}/practice/progress` returns status, total, answered/completed counts, and completion percentage.

Session statuses are `CREATED`, `QUESTIONS_GENERATED`, `IN_PROGRESS`, and `COMPLETED`. Status is derived by backend lifecycle logic. Practice answer edits clear that question's completion mark.
