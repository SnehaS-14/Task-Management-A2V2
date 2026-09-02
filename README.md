# Task-Management-A2V2

A full-stack task-management application for teams. It supports secure authentication, task assignment, comments, filters, and role-based access for administrators, managers, and members.

## Quick start

Prerequisites: Node.js 18+ and a MongoDB instance (local or hosted).

1. Configure the backend.

   ```powershell
   cd Backend
   Copy-Item .env.example .env
   # Edit .env and set MONGODB_URI and a strong JWT_SECRET
   npm install
   ```

2. Configure demo data and start the API.

   ```powershell
   npm run seed
   npm run dev
   ```

   The API starts at `http://localhost:5000`.

3. Start the frontend in a second terminal.

   ```powershell
   cd Frontend
   npm install
   npm run dev
   ```

   Open `http://localhost:5173`.

4. Run backend tests (optional but recommended).

   ```powershell
   cd Backend
   npm test
   ```

## Demo logins

Run `npm run seed` before using these accounts. The seed command clears the configured development database before recreating its data, so do not run it against a database containing data you need to keep.

| Role | Email | Password |
| --- | --- | --- |
| Admin | `alice@example.com` | `Password123!` |
| Manager | `bob@example.com` | `Password123!` |
| Member | `charlie@example.com` | `Password123!` |

To log in as the administrator, use `alice@example.com` and `Password123!`, then open **Admin** in the application navigation. Admins can view team members and assign roles. These are demo credentials only; replace them for any deployment.

## Environment variables

Create `Backend/.env` from `Backend/.env.example`.

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `PORT` | No | API port; defaults to 5000 | `5000` |
| `NODE_ENV` | No | `development`, `test`, or `production` | `development` |
| `MONGODB_URI` | Yes | MongoDB connection string | `mongodb://127.0.0.1:27017/task_management` |
| `JWT_SECRET` | Yes | Secret used to sign access tokens | a long random string |
| `JWT_EXPIRES_IN` | No | JWT lifespan | `1d` |
| `CLIENT_URL` | No | Allowed browser origin for CORS | `http://localhost:5173` |

The frontend uses Vite's development proxy, so it calls `/api` and forwards requests to port 5000. No frontend environment variable is required for local development.

Profile photos are stored locally by the backend in `Backend/uploads/avatars`. The folder is created automatically when a user uploads a PNG, JPEG, or WebP image (maximum 1 MB); it is intentionally ignored by Git.

## Architecture overview

```
React + Vite frontend
        |
        | /api (Vite proxy in development)
        v
Express routes -> middleware -> controllers -> services -> Mongoose models -> MongoDB
```

- **Frontend (`Frontend/`)**: React, TypeScript, Vite, Tailwind CSS, Axios, and React Router. It provides login/register views, task dashboards, task detail and comments, team views, and an admin role-management screen.
- **Backend (`Backend/`)**: Express and TypeScript REST API. Routes are thin; controllers translate HTTP requests and responses; services contain business and authorization rules; Mongoose models define database documents.
- **Database**: MongoDB collections for `users`, `tasks`, and `comments`. Tasks reference a creator and optional assignee; comments reference their task and author.
- **Security**: bcrypt password hashing, JWT authentication, Zod input validation, Helmet, CORS, rate limiting, and central error handling.

## Roles and authorization

| Role | Capabilities |
| --- | --- |
| Admin | Manages team roles, assigns tasks to any user, and manages tasks they are involved in. |
| Manager | Assigns tasks to members and manages tasks they are involved in. |
| Member | Creates tasks, self-assigns/unassigns where permitted, updates task status when assigned, and selects a visible job role in Settings. |

The API enforces authorization server-side. The frontend's route guards are usability features, not the security boundary.

Non-admin users can choose a visible job role in **Settings → Profile**: Engineer, Product Designer, UI/UX Designer, Product Manager, QA Engineer, or Other. This job role is separate from protected access permissions, so selecting a job role never grants admin capabilities.

## API overview

All API responses use a predictable envelope: `{ "success": true, "data": ... }` for success and `{ "success": false, "error": ... }` for errors. Protected requests require `Authorization: Bearer <token>`.

| Area | Endpoints |
| --- | --- |
| Health | `GET /api/health` |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` |
| Users | `GET /api/users`, `GET /api/users/admins`, `PATCH /api/users/me/profile`, `POST /api/users/me/avatar`, `DELETE /api/users/me/avatar`, `PATCH /api/users/:id/role` |
| Tasks | `POST /api/tasks`, `GET /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` |
| Task comments | `POST /api/tasks/:taskId/comments`, `GET /api/tasks/:taskId/comments` |
| Comment edits | `PATCH /api/comments/:commentId`, `DELETE /api/comments/:commentId` |

`GET /api/tasks` supports search, filters (including status, priority, and assignee), sorting, and pagination. A ready-to-import Postman collection is available at `Backend/postman/task-management-collection.json`. See `Backend/README.md` for detailed payloads and response examples.

## Tests

The backend uses Jest, Supertest, and MongoDB Memory Server. The suite covers:

- registration, login, token authentication, validation, duplicate emails, and password exclusion;
- task creation, retrieval, filters, sorting, pagination, updates, deletion, and authorization;
- comment creation, editing, deletion, ownership checks, and task-deletion cleanup; and
- user listing and search.

Run the suite with `cd Backend; npm test`.

## Known limitations

- JWTs are stored in browser local storage, which is convenient for this assessment but is less resistant to XSS than an HTTP-only cookie approach.
- There is no refresh-token, password-reset, email-verification, or account-lockout flow.
- Role management does not include audit history or an explicit last-admin protection rule.
- Tests are backend integration tests; frontend component and end-to-end browser tests are not included.
- The local Vite proxy is for development. A production deployment needs a separately configured frontend API origin/reverse proxy and secure environment secrets.
- The seed script intentionally deletes all documents in the configured database; it is development-only.

## Project structure

```
Frontend/     React application
Backend/      Express API, Mongoose models, tests, and Postman collection
DECISIONS.md  Technical decisions and tradeoffs
AI_USAGE.md   AI-use disclosure and review record
```
