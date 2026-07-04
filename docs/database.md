# Database Documentation

The database uses UUID primary keys, foreign keys with cascade semantics, indexes for queue polling, soft-delete columns, updated-at triggers, Row Level Security, and Supabase Realtime publication.

## Job Lifecycle

```text
queued -> scheduled -> claimed -> running -> completed
queued -> claimed -> running -> failed -> retrying -> queued
failed -> dead_letter
```

## RLS Model

Users can access organization-scoped data only when they are members of that organization. Workers use the service-role key and call security-definer RPCs for controlled queue operations.

## Realtime Tables

- `jobs`
- `queues`
- `workers`
- `job_logs`
- `notifications`
