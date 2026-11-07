# Backend local configuration

Copy `.env.example` to `.env`, then set the database password, OpenAI key, and a private JWT signing key. Generate the JWT key with:

```sh
openssl rand -base64 32
```

Run the backend with `backend/` as the working directory so Spring Boot loads `backend/.env`. Keep `.env` out of version control. In deployed environments, provide the same values through the runtime's secret/environment configuration. `APP_ALLOWED_ORIGIN` should be the exact trusted frontend origin.

The project does not yet use an automated migration framework. For an existing PostgreSQL database, run `src/main/resources/db/manual/V1__add_interview_session_owner.sql` after the authentication schema (including `app_users`) exists. The migration adds a nullable owner foreign key and an owner/date index. Existing rows keep `owner_id = NULL`; they are excluded from user queries until explicitly mapped to their correct account, and are never assigned to whichever user registers first. New sessions created through the API always receive the authenticated owner. Hibernate schema update remains enabled for the other application tables.
