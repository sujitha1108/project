# Architecture

```mermaid
flowchart LR
  Browser[React SaaS UI] --> SupabaseAuth[Supabase Auth]
  Browser --> SupabaseApi[Supabase PostgREST]
  Browser --> Realtime[Supabase Realtime]
  Worker[Node Worker] --> RPC[Postgres RPC: claim_next_job]
  Worker --> Jobs[(jobs)]
  Worker --> Logs[(job_logs)]
  Worker --> DLQ[(dead_letter_queue)]
  SupabaseApi --> Postgres[(Supabase PostgreSQL)]
  Realtime --> Browser
```

The frontend is a Vite React app that reads and mutates Supabase tables through a shared service layer. Supabase Auth protects routes and Row Level Security scopes user access to organization membership.

The worker is a separate Node process. It registers itself, heartbeats periodically, atomically claims available jobs with `claim_next_job`, executes handlers from the registry, and records completion, retry, or dead-letter transitions through RPC functions.
