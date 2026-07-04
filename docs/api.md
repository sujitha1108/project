# API Documentation

The application uses Supabase PostgREST, Auth, Realtime, and PostgreSQL RPC functions.

## Auth

- Email login: `supabase.auth.signInWithPassword`
- Email signup: `supabase.auth.signUp`
- Google sign in: `supabase.auth.signInWithOAuth({ provider: "google" })`
- Password reset: `supabase.auth.resetPasswordForEmail`

## Tables

- `projects`: CRUD project records, archive with `status = archived`
- `queues`: CRUD queues, pause/resume with `status`
- `jobs`: enqueue and filter jobs
- `workers`: monitor worker state and heartbeat freshness
- `job_logs`: execution logs
- `notifications`: user and organization notifications

## RPC

- `claim_next_job(target_worker_id uuid)`: atomically claims the highest-priority available job with `FOR UPDATE SKIP LOCKED`
- `record_worker_heartbeat(target_worker_id uuid, worker_load numeric, worker_memory int)`: records worker health
- `complete_job(target_job_id uuid, target_worker_id uuid, job_result jsonb)`: completes a job and clears worker assignment
- `fail_job(target_job_id uuid, target_worker_id uuid, failure_message text)`: retries or moves a job to the DLQ
