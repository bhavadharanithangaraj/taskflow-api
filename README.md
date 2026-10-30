# TaskFlow API

A REST API for personal task management, built with **Node.js, Express, PostgreSQL and JWT**.
Users register, log in, and manage their own tasks: create, list (with a status filter and pagination), update and delete.

![CI](https://github.com/bhavadharanithangaraj/taskflow-api/actions/workflows/ci.yml/badge.svg)

## Tech stack

| Area | Tools |
|---|---|
| Runtime / framework | Node.js 24, Express 5 |
| Database | PostgreSQL 16 with the `pg` driver (parameterized SQL) |
| Auth | bcrypt password hashing (`bcryptjs`), JWT (`jsonwebtoken`) |
| Validation | zod |
| Testing | Jest + Supertest (14 API tests against a real Postgres) |
| DevOps | Docker, Docker Compose, GitHub Actions CI |

## Project structure

Requests flow **routes → controllers → services → db**:

```
src/
├── server.js              # starts the HTTP server
├── app.js                 # builds the Express app (used by server.js and tests)
├── config/env.js          # reads all settings from environment variables
├── routes/                # URL → middleware → controller
│   ├── index.js           #   /api/health, mounts /api/auth and /api/tasks
│   ├── auth.routes.js
│   └── task.routes.js
├── controllers/           # HTTP layer: read the request, call the service, send the response
├── services/              # business logic and SQL (no req/res here)
├── validators/            # zod schemas for bodies, query strings and URL params
├── middleware/
│   ├── auth.js            #   JWT guard → req.user
│   ├── validate.js        #   runs zod schemas → req.valid or a 400
│   └── errorHandler.js    #   404 handler + one JSON error format
├── db/
│   ├── pool.js            #   shared Postgres connection pool
│   └── migrate.js         #   npm run db:migrate
└── utils/AppError.js      # error with HTTP status + code
db/schema.sql              # users and tasks tables
tests/                     # Jest + Supertest API tests
```

## API endpoints

Base URL: `http://localhost:3000/api`. Routes marked 🔒 need the header `Authorization: Bearer <token>`.

| Method | Endpoint | Auth | Description | Success |
|---|---|---|---|---|
| GET | `/health` | | API and database status | 200 |
| POST | `/auth/register` | | Create an account → `{ user, token }` | 201 |
| POST | `/auth/login` | | Log in → `{ user, token }` | 200 |
| GET | `/auth/me` | 🔒 | Current user | 200 |
| GET | `/tasks?status=&page=&limit=` | 🔒 | List your tasks (newest first) | 200 |
| POST | `/tasks` | 🔒 | Create a task | 201 |
| GET | `/tasks/:id` | 🔒 | Get one task | 200 |
| PATCH | `/tasks/:id` | 🔒 | Update any of: title, description, status, dueDate | 200 |
| DELETE | `/tasks/:id` | 🔒 | Delete a task | 204 |

**Task fields:** `title` (required, max 200), `description` (optional), `status` = `todo` \| `in_progress` \| `done` (default `todo`), `dueDate` = `YYYY-MM-DD` (optional).
**List query:** `status` (optional filter), `page` (default 1), `limit` (default 10, max 100).

A user can only see and change their own tasks. Another user's task returns **404**.

### Example

```bash
# Register and keep the token
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bhava","email":"bhava@example.com","password":"secret123"}'

# Create a task
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"title":"Write README","dueDate":"2026-11-05"}'

# List "done" tasks, page 1, 5 per page
curl "http://localhost:3000/api/tasks?status=done&page=1&limit=5" -H "Authorization: Bearer <token>"
```

List response:

```json
{
  "data": [{ "id": 1, "title": "Write README", "description": null, "status": "done",
             "dueDate": "2026-11-05", "createdAt": "...", "updatedAt": "..." }],
  "pagination": { "page": 1, "limit": 5, "total": 1, "totalPages": 1 }
}
```

### Error format

Every error has the same shape:

```json
{
  "error": {
    "status": 400,
    "code": "BAD_REQUEST",
    "message": "Validation failed",
    "details": [{ "field": "status", "message": "Status must be one of: todo, in_progress, done" }]
  }
}
```

| Status | Code | When |
|---|---|---|
| 400 | `BAD_REQUEST` / `INVALID_JSON` | Validation failed or the body isn't valid JSON |
| 401 | `UNAUTHORIZED` | Missing, invalid or expired token; wrong email or password |
| 404 | `NOT_FOUND` | Unknown route, or the task doesn't exist or isn't yours |
| 409 | `CONFLICT` | Email already registered |
| 500 | `INTERNAL_ERROR` | Unexpected server error (details are logged, not returned) |

## Run it

### Option 1: everything in Docker

```bash
docker compose up --build
```

The API runs at http://localhost:3000/api/health and Postgres at `localhost:5434`.
If port 3000 is busy, use `API_PORT=3002 docker compose up --build`.

### Option 2: Node locally, database in Docker

```bash
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
npm install
docker compose up -d db       # Postgres on port 5434, tables created automatically
npm run dev                   # http://localhost:3000, restarts on file changes
```

For any other database (for example Neon), set `DATABASE_URL` and `DB_SSL=true` in `.env`, then run `npm run db:migrate` to create the tables.

## Tests

```bash
docker compose up -d db
npm test
```

The tests use a separate `taskflow_test` database, which is created automatically, so they never touch your development data.
They cover health, register (including bcrypt hashing), duplicate email, validation errors, login, the JWT guard, task CRUD, the status filter, pagination, partial updates, and that one user can't access another user's tasks.
GitHub Actions runs the same suite against a Postgres service on every push.

## Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `DATABASE_URL` | `postgres://taskflow:taskflow@localhost:5434/taskflow` | Postgres connection |
| `DB_SSL` | `false` | `true` for cloud databases |
| `JWT_SECRET` | dev-only value | Token signing secret (**required** when `NODE_ENV=production`) |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `TEST_DATABASE_URL` | `.../taskflow_test` | Database used by `npm test` |
