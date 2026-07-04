# Distributed Job Scheduler

Production-oriented full-stack SaaS application for managing organizations, projects, queues, workers, asynchronous jobs, retries, schedules, execution logs, realtime monitoring, notifications, and analytics.

## Structure

- `frontend/`: React, Vite, TypeScript, Tailwind, shadcn/ui conventions, React Router, TanStack Query, Supabase Auth/Realtime
- `worker/`: separate Node worker for polling, claiming, executing, retrying, and dead-lettering jobs
- `supabase/`: SQL migration and seed data
- `docs/`: architecture, ER, API, and database documentation
- `scripts/`: operational helpers

## Setup

1. Copy `.env.example` to `.env`.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Copy `worker/.env.example` to `worker/.env`.
4. Replace placeholder Supabase values.
5. Apply `supabase/migrations/001_initial_schema.sql`.
6. Apply `supabase/seed.sql`.
7. Install dependencies:

```bash
npm install --prefix frontend
npm install --prefix worker
```

## Run

```bash
npm run dev:frontend
npm run dev:worker
```

## Build

```bash
npm run build
```
