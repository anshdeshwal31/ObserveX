Clerk Authentication Integration

Overview

- Web app uses Clerk for sign-in/sign-up and session management.
- API uses Clerk Express middleware to verify requests and populate `req.user_id`.
- Local username/password auth is removed.

Required environment variables
Backend (apps/api)

- `CLERK_SECRET_KEY` — Clerk backend secret key.
- `CLERK_PUBLISHABLE_KEY` — optional if you also serve any Clerk front-end assets from the API (not required).
- `FRONTEND_URL` — allowed origin for CORS (set to your web app URL).

Frontend (apps/web)

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key.
- `CLERK_SECRET_KEY` — required for Clerk server helpers (middleware and webhooks).
- `CLERK_WEBHOOK_SECRET` — required for `/api/webhook` user provisioning.
- `NEXT_PUBLIC_API_URL` — API base URL (ex: http://localhost:3000).

API auth flow

- The API uses `clerkMiddleware()` and `getAuth(req)` to ensure a valid Clerk session.
- On success the request gets `(req as any).user_id = auth.userId` which is used by existing queries.
- Requests must include `Authorization: Bearer <Clerk JWT>`.

Web auth flow

- The app renders Clerk `SignIn` / `SignUp` UI at `/auth`.
- Protected routes require a valid Clerk session; the Next.js middleware enforces this.

Tests

- Set the following environment variables to run tests:
  - `CLERK_TEST_USER_ID`, `CLERK_TEST_JWT`
  - `CLERK_TEST_USER_ID_2`, `CLERK_TEST_JWT_2`
- These must correspond to valid Clerk users and session JWTs.

Notes

- The webhook handler (`apps/web/app/api/webhook/route.ts`) creates a `User` row on `user.created`.
- Ensure your Prisma schema matches the fields used in that handler.
