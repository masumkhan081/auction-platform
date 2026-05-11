# Auction Platform V1

A real-time, robust, and mobile-first auction platform built as a monorepo.

## Architecture

- **Frontend:** Next.js 13+ (App Router), React Hook Form, Zod, Tailwind CSS, Shadcn UI
- **Backend:** NestJS, Socket.io, Postgres (Drizzle ORM)
- **Shared:** Shared TS DTOs, Zod schemas, and enums between client and server
- **Infrastructure:** Docker Compose (Postgres, Redis)

## Setup Instructions

1. **Prerequisites**
   - Node.js >= 20.11.0
   - pnpm >= 9.0.0
   - Docker Desktop (for local DB/Redis)

2. **Installation**
   Run the bootstrap script to install dependencies and link the monorepo:
   ```bash
   pnpm run bootstrap
   ```

3. **Infrastructure Setup**
   Start the local database and Redis containers:
   ```bash
   pnpm run infra:up
   ```

4. **Environment Variables**
   Copy the example environment files for both API and Web packages:
   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env
   ```
   *See [ENV_DOCUMENTATION.md](./ENV_DOCUMENTATION.md) for details.*

5. **Development Server**
   Start both the Next.js frontend and NestJS backend concurrently:
   ```bash
   pnpm run dev
   ```

## Workflow & Tooling

- **Typecheck:** `pnpm run typecheck`
- **Lint:** `pnpm run lint`
- **Format:** `pnpm run format`

## Deployment Assumptions

- **Web (Vercel):** The frontend (`apps/web`) is fully optimized for Vercel. Ensure `NEXT_PUBLIC_API_URL` is configured to point to the production API.
- **API (Railway / Render / AWS):** The backend (`apps/api`) requires a continuous Node.js runtime and access to the production Postgres database and Redis cache.
