# Technical Decisions

## Layered Express backend

**Decision:** Keep routes, middleware, controllers, services, and Mongoose models separate.

**Why:** This keeps HTTP handling, validation, authorization, business rules, and persistence concerns independently understandable and testable.

**Alternative considered:** Place business rules directly in Express route handlers. That is quicker for a small prototype, but makes authorization and reuse harder to test and maintain.

**Tradeoff:** More files and indirection for a small application, in exchange for clearer boundaries as features grow.

## MongoDB with Mongoose

**Decision:** Use MongoDB with Mongoose schemas for users, tasks, and comments.

**Why:** The data model is document-oriented and Mongoose provides validation, references, indexes, and lifecycle hooks such as password hashing.

**Alternative considered:** A relational database with an ORM. It would provide stronger database-level relational constraints but would require additional migration and schema-management setup.

**Tradeoff:** References are application-managed and MongoDB does not provide the same relational constraints as a SQL database; the code compensates with service-level checks and indexes.

## JWT authentication

**Decision:** Use signed, expiring JWT bearer tokens with bcrypt password hashes.

**Why:** The frontend and API are separate applications, and stateless tokens make the API simple to run without a session store.

**Alternative considered:** Server-side sessions with HTTP-only cookies. That approach can better reduce JavaScript access to tokens but needs CSRF considerations and session storage at scale.

**Tradeoff:** The current frontend persists the JWT in local storage for simplicity. A production version should consider short-lived access tokens plus secure HTTP-only refresh cookies and a stronger XSS defense strategy.

## Role-based access control

**Decision:** Use `admin`, `manager`, and `member` roles, enforced by backend middleware and services.

**Why:** Team task management requires different authority levels. Server-side checks prevent a user from gaining permissions by manipulating the browser UI.

**Assumptions:** Admins and managers may assign tasks to other users; members may self-assign when allowed. The task creator can make full task edits; an assignee is limited to status-only updates.

**Tradeoff:** RBAC is easy to explain and implement but is less flexible than per-resource permissions or custom policy rules.

## Job roles separate from permissions

**Decision:** Keep the protected access role (`admin`, `manager`, or `member`) separate from the visible job role selected by non-admin users (for example Engineer, Product Designer, or UI/UX Designer).

**Why:** A job title describes someone's discipline; it must not accidentally grant administrative capabilities. Admin remains a workspace permission and is locked in the profile UI.

**Tradeoff:** The model has two role-related fields, but the distinction avoids a security bug and lets team members accurately describe their work.

## Validation, security headers, and request limits

**Decision:** Validate inputs with Zod, set Helmet headers, restrict CORS to the configured client URL, and apply API/auth rate limits.

**Why:** These are low-complexity safeguards against malformed input, common browser attacks, cross-origin misuse, and repeated login attempts.

**Alternative considered:** Rely solely on Mongoose validation. That would validate too late and would not give the API consistent request-level error responses.

**Tradeoff:** Validation schemas must be maintained alongside models, but provide clearer client feedback and a smaller attack surface.

## Testing strategy

**Decision:** Use Jest + Supertest with MongoDB Memory Server for backend integration tests.

**Why:** Tests exercise actual routes, middleware, services, and database behavior in isolation without modifying a developer database.

**Tradeoff:** This does not cover browser rendering, accessibility, or full deployment wiring. Those would be the next testing layers.

## Operational assumptions

- Node.js 18+ and a reachable MongoDB instance are available.
- Secrets are supplied through `Backend/.env` and are never committed.
- The Vite proxy is used only in local development; production networking is configured by the deployment environment.
- The included demo accounts and seed command are for evaluation only, not production use.
