# Interview Buddy

Interview Buddy is a full-stack interview preparation application that helps users create role-specific interview sessions, generate practice questions with AI, review suggested answers, and track their preparation.

## Features

- Create interview sessions by role, difficulty, interview type, and topic.
- Generate interview questions and suggested answers using OpenAI through Spring AI.
- View sessions in **My Interview** and practice with generated questions.
- Save and revisit practice answers (where enabled in the current implementation).
- Register and sign in using JWT-based authentication.
- Track interview session progress and status.

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React, TypeScript, Vite |
| Backend | Java 21, Spring Boot, Spring Security, Spring AI |
| Database | PostgreSQL |
| AI | OpenAI API via Spring AI |
| Authentication | JWT access and refresh tokens |

## Project structure

```text
Interview Buddy/
├── backend/                 # Spring Boot API
├── frontend/                # React + TypeScript application
├── .env                     # Local secrets (do not commit)
├── .env.example             # Environment variable template
├── start-backend.sh         # Optional local startup helper
└── README.md
```

> The startup script is optional and must be created separately if it does not already exist.

## Prerequisites

- Java 21
- Maven
- Node.js and npm
- PostgreSQL
- An OpenAI API key with available API credits

## Local setup

### 1. Clone the repository

```bash
git clone https://github.com/phyothinzaraung/Interview-Buddy.git
cd Interview-Buddy
```

### 2. Configure environment variables

Create a `.env` file at the project root. If `.env.example` is available, use it as a starting point.

```dotenv
OPENAI_API_KEY=replace_with_your_openai_api_key
JWT_SECRET_BASE64=replace_with_a_base64_encoded_32_byte_secret
```

Generate a signing secret **once** using:

```bash
openssl rand -base64 32
```

Keep the generated value in `.env` and reuse it across application restarts. Do not commit `.env` or share its contents. A new signing secret invalidates previously issued JWTs.

Database credentials and other settings should be configured according to `backend/src/main/resources/application.properties` and your local PostgreSQL installation. Create the database expected by that configuration before starting the API.

### 3. Start the backend

From the project root:

```bash
set -a
source .env
set +a
cd backend
mvn spring-boot:run
```

Alternatively, if you have created `start-backend.sh`, run it from the project root:

```bash
./start-backend.sh
```

The backend normally runs at **http://localhost:8080**.

**IDE users:** Configure your Spring Boot Run/Debug configuration to load the same root `.env` file. IDE Run buttons do not always load `.env` automatically.

### 4. Start the frontend

In another terminal, from the project root:

```bash
cd frontend
npm install
npm run dev
```

The Vite development server normally runs at **http://localhost:5173**. Frontend API proxy settings should point to the backend on port 8080.

## Typical workflow

1. Register or sign in.
2. Create an interview session with a role, difficulty, interview type, and topic.
3. Generate interview questions and suggested answers.
4. Open the session in **My Interview**.
5. Practice, review suggested answers, and save responses where supported.

## Session statuses

The intended interview lifecycle is:

```text
CREATED → QUESTIONS_GENERATED → IN_PROGRESS → COMPLETED
```

The Java enum, frontend, and PostgreSQL status constraint must agree on these values. If your local database predates the current lifecycle, apply the project's reviewed migrations instead of deleting existing data.

## Development checks

Run backend tests:

```bash
cd backend
mvn test
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Troubleshooting

### `JWT_SECRET_BASE64 must be valid Base64`

Ensure `JWT_SECRET_BASE64` contains a valid Base64-encoded signing secret and that your terminal or IDE actually loads the root `.env` file. Do not generate a new secret on every run.

### `401 Unauthorized` on `/api/auth/refresh`

A refresh token may be missing, expired, or invalid. Sign in again after changing the JWT signing secret. If the problem continues, inspect frontend refresh handling and backend authentication logs without printing tokens.

### `500 Internal Server Error` during question generation

Check the backend exception first. Common areas to investigate include AI provider failures, response parsing, database schema migrations, and session status constraints. Preserve existing interview data when making fixes.

### PostgreSQL status check constraint error

If `QUESTIONS_GENERATED` violates `interview_sessions_status_check`, the database constraint may not match the current Java enum. Update it through a reviewed, non-destructive migration.

## Security

- Never commit `.env`, API keys, database passwords, or JWT secrets.
- Keep `.env.example` limited to placeholder values.
- Do not log access or refresh tokens.
- Protect user-specific interview data with backend authentication and authorization checks.
- Use separate secrets and appropriate configuration for production deployments.

## Roadmap

Potential future enhancements include AI answer evaluation, personalized feedback, scoring, and voice-based mock interviews. These are roadmap ideas, not guaranteed current features.

## License

No license has been specified. Add a `LICENSE` file if you decide to define reuse permissions.
