# Task Management Application — Backend

A secure, modern, multi-user Task Management REST API built for an internal engineering team. Users can register, authenticate, manage tasks, assign them to teammates, and discuss them via comments.

This repository contains **only the backend**. It is designed as a clean, production-oriented API that a React frontend can be built on directly.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Documentation](#technology-documentation)
- [Database Documentation](#database-documentation)
- [Authentication Documentation](#authentication-documentation)
- [Authorization Documentation](#authorization-documentation)
- [API Documentation](#api-documentation)
- [Error Documentation](#error-documentation)
- [Security Documentation](#security-documentation)
- [Setup Documentation](#setup-documentation)
- [API Testing Documentation](#api-testing-documentation)
- [Postman Collection](#postman-collection)

---

## Project Overview

The Task Management Application allows multiple users to:

- **Register** and **login**
- View their own **profile** and a list of **users** (to build assignee dropdowns)
- **Create**, **view**, **edit**, **delete**, and **assign** tasks
- **Search**, **filter**, **sort**, and **paginate** tasks
- Change task **status** and **priority**
- View **task details**
- **Add**, **edit**, and **delete** comments on tasks

The backend enforces authentication (JWT + bcrypt), authorization rules (who may edit/delete what), input validation (Zod), centralized error handling, and layered security (Helmet, CORS, rate limiting).

---

## Architecture

The backend follows a **clean layered architecture**:

```
Routes
   ↓
Middleware
   ↓
Controllers
   ↓
Services
   ↓
Models
   ↓
MongoDB
```

**Why this structure was chosen:**

- **Routes** define the HTTP surface (URLs + HTTP methods) and wire up validation + middlewares. They contain no business logic.
- **Middleware** handles cross-cutting concerns: authentication, validation, and error handling.
- **Controllers** handle HTTP-level concerns only — parsing the request, calling a service, and formatting the response. Because errors bubble up to a centralized handler, controllers stay free of repetitive `try/catch`.
- **Services** hold the business logic (creating tasks, enforcing authorization decisions, database queries). This makes business rules deterministic and testable in isolation from HTTP.
- **Models** define the Mongoose schemas, indexes, and document shape.
- **MongoDB** is the persistent store.

This separation keeps each layer focused, makes the codebase easy to reason about, and ensures a React frontend only ever interacts with the controllers' predictable JSON responses.

```
backend/
├── src/
│   ├── config/          Environment validation + MongoDB connection
│   ├── controllers/     HTTP handlers
│   ├── middleware/      auth, validation, error handling
│   ├── models/          User, Task, Comment schemas
│   ├── routes/          Express routers
│   ├── services/        Business logic + authorization
│   ├── validators/      Zod schemas
│   ├── types/           Shared TypeScript types
│   ├── utils/           JWT, errors, response helpers, async wrapper
│   ├── app.ts           Express app assembly
│   └── server.ts        Server bootstrap
├── scripts/             (dev scripts)
├── tests/               Jest + Supertest integration tests
└── src/scripts/seed.ts  Development seed data
```

---

## Technology Documentation

### Node.js

**What:** A JavaScript runtime that executes JavaScript on the server.

**Why:** Standard, mature ecosystem for building REST APIs.

**Problem it solves:** Running the server-side application logic outside the browser.

**Where used in this project:** Executes the Express REST API (`server.ts` boots the HTTP server).

### TypeScript

**What:** A typed superset of JavaScript that compiles to plain JavaScript.

**Why:** Static typing catches errors at compile time and improves maintainability.

**Problem it solves:** Reduces runtime bugs, documents interfaces (models, inputs, responses), and improves editor/IDE support.

**Where used in this project:** All source code (`src/**`) is written in TypeScript and compiled with `tsc` to `dist/`.

### Express.js

**What:** A minimal, unopinionated Node.js web framework.

**Why:** Industry standard for building REST APIs with a large middleware ecosystem.

**Problem it solves:** HTTP routing, middleware composition, and request/response handling.

**Where used in this project:** Every API route (`src/routes/`) and the app assembly in `app.ts`.

### MongoDB

**What:** A schema-flexible, document-oriented NoSQL database.

**Why:** Fits the relational, nested nature of tasks + comments + users, scales well, and integrates seamlessly with Mongoose.

**Problem it solves:** Storing users, tasks, and comments as documents with embedded relationships via ObjectId refs; enables text search and compound indexes.

**Where used in this project:** The persistent database accessed through Mongoose (`src/config/db.ts`).

### Mongoose

**What:** An Object Document Mapper (ODM) for MongoDB and Node.js.

**Why:** Provides schemas, validation, middleware (hooks), and query building on top of the MongoDB driver.

**Problem it solves:** Enforces a structured schema (enums for status/priority), relationship population, the password pre-save hook, and database indexes.

**Where used in this project:** Models in `src/models/`, services that query data, and the connection in `src/config/db.ts`.

### JWT (jsonwebtoken)

**What:** JSON Web Tokens — signed tokens carrying a compact set of claims.

**Why:** Stateless authentication lets the server verify a user without a session store.

**Problem it solves:** Telling the server *who* the request is from (`user.id`) on every authenticated request, verifying token integrity with a signature.

**Where used in this project:** Token signing/verification in `src/utils/jwt.ts`; issued on register/login; verified by `src/middleware/auth.ts`.

### bcrypt (bcryptjs)

**What:** A password-hashing library implementing the bcrypt key derivation function.

**Why:** Passwords must never be stored in plaintext or weak hashes.

**Problem it solves:** Deterministically hashing passwords with a per-user salt so hashes cannot be reversed or easily brute-forced.

**Where used in this project:** The `pre('save')` hook in `src/models/User.ts` hashes new/updated passwords, and `comparePassword` verifies logins.

### Zod

**What:** A TypeScript-first schema declaration and validation library.

**Why:** Declarative, type-safe input validation with first-class TypeScript inference.

**Problem it solves:** Validating request bodies, query strings, and params, producing predictable validation errors, and rejecting arbitrary/operator values.

**Where used in this project:** All `src/validators/*.ts` schemas, consumed by `src/middleware/validate.ts`.

### Helmet

**What:** A collection of HTTP security headers middleware.

**Why:** Hardens HTTP responses against common web vulnerabilities.

**Problem it solves:** Setting headers such as `X-Content-Type-Options`, `X-Frame-Options`, and CSP to mitigate clickjacking, MIME sniffing, and XSS.

**Where used in this project:** Registered as the first global middleware in `src/app.ts`.

### CORS (cors)

**What:** Middleware that configures Cross-Origin Resource Sharing.

**Why:** The future React frontend runs on a different origin (`CLIENT_URL`) and needs CORS to call this API from the browser.

**Problem it solves:** Allowing only the configured frontend origin to make requests while blocking others.

**Where used in this project:** `src/app.ts`, configured with `CLIENT_URL`.

### express-rate-limit

**What:** Middleware that limits repeated requests per IP.

**Why:** Protects against brute-force and denial-of-service.

**Problem it solves:** Throttling authentication endpoints (login/register) more aggressively and applying a general limit to all `/api` routes.

**Where used in this project:** A strict limiter on auth routes (`src/routes/auth.routes.ts`) and a general limiter in `src/app.ts`.

### Jest

**What:** A JavaScript testing framework with assertions, mocking, and coverage.

**Why:** Standard, well-supported test runner for Node/TypeScript.

**Problem it solves:** Structuring and executing our integration test suites.

**Where used in this project:** `tests/*.test.ts` run via `jest`.

### Supertest

**What:** An HTTP assertion library for testing Express apps.

**Why:** Lets tests issue real HTTP requests against the app without starting a network listener.

**Problem it solves:** Exercising the full stack — routes → middleware → controllers → services → models — through the JSON API.

**Where used in this project:** Every test file in `tests/` makes requests with `supertest`.

### MongoDB Memory Server

**What:** A binary wrapper that runs an in-memory MongoDB instance.

**Why:** Provides an isolated, disposable database for tests.

**Problem it solves:** Letting tests run against a real MongoDB engine without a local installation or wiping a dev database.

**Where used in this project:** `tests/global-setup.ts` starts the in-memory server; tests connect via `process.env.MONGODB_URI`.

---

## Database Documentation

### User Schema (`src/models/User.ts`)

| Field       | Type     | Constraints                                |
| ----------- | -------- | ------------------------------------------ |
| `name`      | String   | required, trimmed, ≤ 100 chars             |
| `email`     | String   | required, unique, lowercase, ≤ 254 chars   |
| `password`  | String   | required, ≥ 8 chars, hashed, `select:false`|
| `createdAt` | Date     | auto (timestamps)                          |
| `updatedAt` | Date     | auto (timestamps)                          |

The password uses `select: false` so it is never returned by default in queries.

### Task Schema (`src/models/Task.ts`)

| Field         | Type     | Constraints                                      |
| ------------- | -------- | ------------------------------------------------ |
| `title`       | String   | required, trimmed, ≤ 200 chars                   |
| `description` | String   | optional, ≤ 2000 chars                           |
| `status`      | String   | enum `Todo / In Progress / Done`, default `Todo` |
| `priority`    | String   | enum `Low / Medium / High`, default `Medium`     |
| `assignee`    | ObjectId | ref `User`, optional/nullable                    |
| `creator`     | ObjectId | ref `User`, required (from authenticated JWT)    |
| `createdAt`   | Date     | auto                                             |
| `updatedAt`   | Date     | auto                                             |

### Comment Schema (`src/models/Comment.ts`)

| Field       | Type     | Constraints                      |
| ----------- | -------- | -------------------------------- |
| `task`      | ObjectId | ref `Task`, required             |
| `author`    | ObjectId | ref `User`, required             |
| `content`   | String   | required, trimmed, ≤ 1000 chars  |
| `createdAt` | Date     | auto                             |
| `updatedAt` | Date     | auto                             |

### Relationships

- **creator → User**: A task has exactly one creator (the authenticated user who created it). One user can create many tasks.
- **assignee → User**: A task may be assigned to one user. One user can be the assignee of many tasks.
- **author → User**: A comment has exactly one author (the authenticated user who wrote it). One user can write many comments.
- **task → Task**: A comment belongs to exactly one task. One task can have many comments.

### Indexes and rationale

Addressed in `src/models/`:

| Index                        | Why it exists                                                              |
| ---------------------------- | -------------------------------------------------------------------------- |
| `User.email` unique          | Enforces unique emails and speeds up the login/registration email lookup.  |
| `Task.creator` (+ createdAt) | Speeds up "tasks I created" and per-creator listing/ordering.              |
| `Task.assignee` (+ createdAt)| Speeds up filtering/listing by assignee (dropdown + filters).              |
| `Task.status`                | Speeds up exact-match status filters.                                      |
| `Task.priority`              | Speeds up exact-match priority filters.                                    |
| `Task` text on title/desc    | MongoDB text index powers case-insensitive keyword search.                 |
| `Comment.task` (+ createdAt) | Speeds up listing comments for a task and ordering them.                   |
| `Comment.author`             | Speeds up looking up a user's comments (authorization checks).             |

### Why comments are a separate collection

Comments are deeply tied to tasks but have their **own lifecycle and authorization** (a comment has its own author who can edit/delete it independently of the task). Storing them in a separate collection:

- Keeps task documents small and fast to load.
- Allows efficient paginated/ordered comment listing per task.
- Lets comments be cascade-deleted on task deletion independently.
- Keeps authorization granular (comment author vs. task owner are different concepts).

---

## Authentication Documentation

### The complete authentication flow

```
Register
   ↓
Password hashing (bcrypt, pre-save hook)
   ↓
User creation (email normalized & unique)
   ↓
JWT generation (signs { id, name, email })
   ↓
Client stores token (e.g. localStorage)
   ↓
Client sends: Authorization: Bearer <TOKEN>
   ↓
Authentication middleware
   ↓
JWT verification (signature + expiry)
   ↓
User lookup + attach user to request
   ↓
Authenticated request handler
```

### Why passwords are hashed

Passwords must never be stored or transmitted in recoverable/plaintext form. `bcryptjs` applies a one-way hash with a per-user salt, so even if the database is compromised, the original passwords cannot be recovered, and identical passwords produce different hashes.

### Why JWT is used

JWTs are **stateless** — the server does not need a session store. After login the client receives a signed token; on each request the middleware verifies the signature and reads the user ID from it. The token is signed with the server's `JWT_SECRET` and expires after `JWT_EXPIRES_IN`. Only a minimal, non-sensitive claim (`id`, `name`, `email`) is embedded — never the password or the hash.

---

## Authorization Documentation

The backend enforces the following authorization rules. The user ID is **always** taken from the verified JWT, never trusted from the client.

| Action         | Allowed user                         | Status code on denial |
| -------------- | ------------------------------------ | --------------------- |
| View tasks     | Any authenticated user               | 401 if unauthenticated|
| Create task    | Any authenticated user               | 401 if unauthenticated|
| Edit task      | Task creator (any field)             | 403                   |
| Update status  | Assignee (status only)               | 403                   |
| Delete task    | Task creator                         | 403                   |
| Add comment    | Any authenticated user               | 401 if unauthenticated|
| Edit comment   | Comment author                       | 403                   |
| Delete comment | Comment author                       | 403                   |

**Reasoning:**

- A task is owned by its **creator** — only the creator may edit or delete it.
- The **assignee** is allowed to change the **status** (a common workflow: the person working a task reports "In Progress"/"Done") but cannot reword the task.
- Comments belong to their **author** — only that author may edit or delete them.
- A user cannot assign a task to a **nonexistent** user (validated by the service, returns 404).
- A user cannot change the task **creator** — the creator is derived from the authenticated JWT and the field is rejected from client input.

---

## API Documentation

**Common response format:**

```json
// Success
{ "success": true, "data": { } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

**Authentication:** `Authorization: Bearer <TOKEN>`

---

### `GET /api/health`

Authentication: None. Purpose: verify the API is running.

```json
{ "success": true, "data": { "status": "ok" } }
```

---

### `POST /api/auth/register`

Authentication: None. Purpose: create an account and return a token.

Body: `{ "name": "John Doe", "email": "john@example.com", "password": "Password123!" }`

Response `201`:

```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "user": { "id": "...", "name": "John Doe", "email": "john@example.com", "createdAt": "...", "updatedAt": "..." }
  }
}
```

Errors: `422` validation, `409` duplicate email.

---

### `POST /api/auth/login`

Authentication: None. Purpose: authenticate and return a token.

Body: `{ "email": "john@example.com", "password": "Password123!" }`

Response `200`: same shape as register. Errors: `401` invalid credentials, `422` validation.

---

### `GET /api/auth/me`

Authentication: Required. Purpose: return the authenticated user's profile.

Response `200`:

```json
{ "success": true, "data": { "user": { "id": "...", "name": "John Doe", "email": "john@example.com" } } }
```

Errors: `401` unauthenticated, `422` validation.

---

### `GET /api/users`

Authentication: Required. Purpose: list users for the assignee dropdown.

Query: `search` (optional, matches name/email).

Response `200`:

```json
{ "success": true, "data": { "users": [ { "id": "...", "name": "John Doe", "email": "john@example.com" } ] } }
```

Never returns passwords.

---

### `POST /api/tasks`

Authentication: Required. Purpose: create a task. Creator comes from the JWT.

Body: `{ "title": "Implement login", "description": "Build JWT login", "status": "Todo", "priority": "High", "assignee": "USER_ID" }`

Response `201`:

```json
{
  "success": true,
  "data": {
    "task": {
      "id": "...", "title": "Implement login", "description": "...", "status": "Todo", "priority": "High",
      "assignee": { "id": "...", "name": "Bob", "email": "bob@example.com" },
      "creator": { "id": "...", "name": "John", "email": "john@example.com" },
      "createdAt": "...", "updatedAt": "..."
    }
  }
}
```

Errors: `401` unauthenticated, `422` validation, `404` assignee not found.

### `GET /api/tasks`

Authentication: Required. Purpose: list tasks with search/filter/sort/pagination (performed at the database level).

Query parameters (all optional, combinable):

| Param      | Values                                 | Default       |
| ---------- | -------------------------------------- | ------------- |
| `page`     | int ≥ 1                                | `1`           |
| `limit`    | int 1–100                              | `10`          |
| `search`   | keyword (title/description)            | —             |
| `status`   | `Todo`/`In Progress`/`Done`            | —             |
| `priority` | `Low`/`Medium`/`High`                  | —             |
| `assignee` | ObjectId                               | —             |
| `creator`  | ObjectId                               | —             |
| `sortBy`   | `createdAt`/`updatedAt`/`title`/`priority`/`status` | `createdAt` |
| `sortOrder`| `asc`/`desc`                           | `desc`        |

Example: `GET /api/tasks?page=1&limit=10&search=API&status=Todo&priority=High&assignee=USER_ID&sortBy=createdAt&sortOrder=desc`

Response `200`:

```json
{
  "success": true,
  "data": {
    "tasks": [ /* TaskDetail[] */ ],
    "pagination": { "page": 1, "limit": 10, "total": 42, "totalPages": 5 }
  }
}
```

Errors: `401`, `422` (e.g. invalid status/priority/ObjectId/limit).

### `GET /api/tasks/:id`

Authentication: Required. Purpose: return one task with creator, assignee, and comments.

Response `200` includes `comments[]`. Errors: `422` invalid id, `404` not found.

### `PATCH /api/tasks/:id`

Authentication: Required. Purpose: update task fields (`title`, `description`, `status`, `priority`, `assignee`). Authorization: creator may update any; assignee may update status only.

Body (any subset): `{ "title": "...", "status": "Done", "assignee": "USER_ID", ... }`

Errors: `422` validation, `403` not authorized, `404` not found, `404` assignee not found.

### `DELETE /api/tasks/:id`

Authentication: Required. Authorization: creator only. Cascade-deletes the task's comments.

Response `200`: `{ "success": true, "data": { "message": "Task deleted successfully" } }`

Errors: `403` not authorized, `404` not found.

---

### `POST /api/tasks/:taskId/comments`

Authentication: Required. Purpose: add a comment (author from JWT) to a task.

Body: `{ "content": "Authentication implementation is completed." }`

Response `201` returns the comment with author info. Errors: `422`, `404` task not found.

### `GET /api/tasks/:taskId/comments`

Authentication: Required. Purpose: list a task's comments (newest first).

Response `200`: `{ "success": true, "data": { "comments": [ { "id", "content", "author": { "id", "name", "email" }, "createdAt", "updatedAt" } ] } }`

### `PATCH /api/comments/:commentId`

Authentication: Required. Authorization: comment author only. Purpose: edit a comment.

Body: `{ "content": "Updated comment text" }`

Errors: `422`, `403`, `404`.

### `DELETE /api/comments/:commentId`

Authentication: Required. Authorization: comment author only. Purpose: delete a comment.

Response `200`: `{ "success": true, "data": { "message": "Comment deleted successfully" } }`

Errors: `403`, `404`.

---

## Error Documentation

All errors share the shape `{ "success": false, "error": { "code", "message", "details" } }`.

| Status | Meaning                                                        | Typical codes                                  |
| ------ | -------------------------------------------------------------- | ---------------------------------------------- |
| `400`  | Malformed request (e.g. invalid resource id)                   | `INVALID_ID`                                   |
| `401`  | Missing/invalid/expired token or bad credentials               | `UNAUTHORIZED`                                 |
| `403`  | Authenticated but not allowed to perform the action            | `FORBIDDEN`                                    |
| `404`  | Resource (task/comment/user) not found                         | `NOT_FOUND`, `TASK_NOT_FOUND`, etc.            |
| `409`  | Conflict, e.g. duplicate email                                 | `CONFLICT`                                     |
| `422`  | Validation failure (body/query/params)                         | `VALIDATION_ERROR`                             |
| `500`  | Unexpected server/internal error (no stack trace in production)| `INTERNAL_ERROR`                               |

The centralized handler (`src/middleware/error.ts`) catches validation, MongoDB, duplicate-key, CastError (invalid ObjectId), JWT, not-found, and unexpected errors, and never exposes stack traces when `NODE_ENV=production`.

---

## Security Documentation

- **Password hashing**: bcrypt with per-user salt via the Mongoose `pre('save')` hook; the hash is `select:false` and never returned.
- **JWT**: signed with `JWT_SECRET`, expired after `JWT_EXPIRES_IN`, carries only non-sensitive claims (`id`, `name`, `email`).
- **Authentication middleware**: verifies `Authorization: Bearer` header, decodes + verifies the JWT, then validates the user still exists before attaching them to the request. User IDs from the client are never trusted.
- **Authorization**: enforced in services/controllers — only the task creator (edit/delete), assignee (status), and comment author (edit/delete) can mutate their resources.
- **Input validation**: Zod validates every body, query, and param. Arbitrary MongoDB operators (`$where`, `$ne`, `$regex`, etc.) cannot be injected because inputs are whitelisted and coerced by schema, and queries are built from a fixed set of fields.
- **NoSQL injection prevention**: Filters are constructed only from validated, stringly-typed query params; no raw user values are passed as operators.
- **Helmet**: sets hardened HTTP security headers.
- **CORS**: restricted to `CLIENT_URL`.
- **Rate limiting**: stricter limiter on `/api/auth/*` and a general limiter on `/api`.
- **Safe error handling**: centralized handler; validation/duplicate/not-found errors are mapped to predictable responses and stack traces are suppressed in production.
- **Sensitive data protection**: passwords are excluded from every response; tokens, secrets, and DB credentials are never logged. `.env` is gitignored.

---

## Setup Documentation

### Prerequisites

- Node.js 18+
- MongoDB running locally (or a remote `MONGODB_URI`)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Create .env from the template
cp .env.example .env
# (Edit MONGODB_URI, JWT_SECRET, CLIENT_URL as needed)

# 3. Start MongoDB (if not already running)
#    e.g. mongod --dbpath ./data

# 4. Start the development server (auto-reload)
npm run dev

# 5. (Optional) Seed demo data
npm run seed

# 6. Run tests
npm test

# 7. Build for production
npm run build

# 8. Run the compiled server
npm start
```

Environment variables (see `.env.example`):

| Variable        | Description                                  | Example                                   |
| --------------- | -------------------------------------------- | ----------------------------------------- |
| `PORT`          | Server port                                  | `5000`                                    |
| `NODE_ENV`      | `development` / `test` / `production`        | `development`                             |
| `MONGODB_URI`   | MongoDB connection string                    | `mongodb://localhost:27017/task_management` |
| `JWT_SECRET`    | Secret used to sign tokens                   | `change_this_secret`                      |
| `JWT_EXPIRES_IN`| Token lifetime                               | `1d`                                      |
| `CLIENT_URL`    | Allowed CORS origin (the frontend)           | `http://localhost:5173`                   |

Required variables are validated on startup (the app exits with a clear message if any are missing/invalid). **Never commit `.env`.**

### Seed data

`npm run seed` clears existing data and creates:

- **Alice** — `alice@example.com`
- **Bob** — `bob@example.com`
- **Charlie** — `charlie@example.com`

All passwords are `Password123!`. It also creates several tasks spanning all statuses (`Todo`/`In Progress`/`Done`) and priorities (`Low`/`Medium`/`High`), assigned between users, plus a few comments. This is for development/testing/demo only.

---

## API Testing Documentation

### curl

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"Password123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"Password123!"}'

# Capture the returned token, then:
TOKEN="YOUR_JWT"

# List users
curl http://localhost:5000/api/users -H "Authorization: Bearer $TOKEN"

# Create task
curl -X POST http://localhost:5000/api/tasks \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Implement login","description":"Build JWT login","priority":"High"}'

# List tasks (combo of search/filter/sort/pagination)
curl "http://localhost:5000/api/tasks?search=API&status=Todo&limit=10&sortBy=createdAt&sortOrder=desc" \
  -H "Authorization: Bearer $TOKEN"

# Update a task (status)
curl -X PATCH http://localhost:5000/api/tasks/TASK_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"status":"In Progress"}'

# Add a comment
curl -X POST http://localhost:5000/api/tasks/TASK_ID/comments \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"content":"Progressing well."}'

# Delete a task
curl -X DELETE http://localhost:5000/api/tasks/TASK_ID -H "Authorization: Bearer $TOKEN"
```

### Postman / Thunder Client

1. Import the collection (`postman/task-management-collection.json`).
2. In the collection, set a `baseUrl` collection variable (e.g. `http://localhost:5000`).
3. Run **Register**, then **Login** (the `token` is captured by an automatic test script).
4. Subsequent requests use the captured token automatically.

The included collection walks the complete flow: register → login → get users → create task → get tasks → get task → update task → add comment → get comments → delete task.

---

## Testing

The test suite uses **Jest + Supertest + MongoDB Memory Server** to run against an isolated in-memory database.

```bash
npm test
```

Coverage includes:

- **Auth**: registration success, duplicate email, invalid registration, login success, invalid login, `/me` authenticated + unauthenticated, and token/email normalization.
- **Tasks**: create, unauthenticated create, invalid task, list, pagination, search, status/priority/assignee filters, sorting, combined query, get task, update task, unauthorized update, delete task, unauthorized delete, cascade comment deletion.
- **Comments**: create, unauthenticated create, list, update own, prevent updating another's, delete own, prevent deleting another's, and not-found cases.
- **Users**: unauthenticated, list without passwords, search by name/email.

---

## Postman Collection

A ready-to-import Postman collection is provided at `postman/task-management-collection.json`. It demonstrates the complete backend flow with a script that automatically stores and reuses the login token.

---

## License

Demo/learning backend. No license specified.
