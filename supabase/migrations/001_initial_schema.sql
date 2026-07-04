create extension if not exists pgcrypto;

create type public.project_status as enum ('active', 'archived');
create type public.queue_status as enum ('active', 'paused', 'archived');
create type public.job_status as enum ('queued', 'scheduled', 'claimed', 'running', 'completed', 'failed', 'retrying', 'dead_letter');
create type public.job_type as enum ('immediate', 'delayed', 'scheduled', 'recurring', 'batch');
create type public.priority as enum ('low', 'normal', 'high', 'critical');
create type public.worker_status as enum ('online', 'offline', 'draining');
create type public.retry_strategy as enum ('fixed', 'linear', 'exponential', 'custom');
create type public.log_level as enum ('debug', 'info', 'warn', 'error');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  status public.project_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (organization_id, name)
);

create table public.retry_policies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  strategy public.retry_strategy not null default 'exponential',
  max_retries int not null default 3 check (max_retries >= 0),
  base_delay_ms int not null default 1000 check (base_delay_ms >= 0),
  max_delay_ms int not null default 60000 check (max_delay_ms >= 0),
  custom_delays_ms int[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.queues (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  retry_policy_id uuid references public.retry_policies(id) on delete set null,
  name text not null,
  status public.queue_status not null default 'active',
  priority public.priority not null default 'normal',
  concurrency int not null default 5 check (concurrency > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (project_id, name)
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  status public.worker_status not null default 'offline',
  current_job_id uuid,
  metadata jsonb not null default '{}',
  last_heartbeat_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete set null,
  name text not null,
  type public.job_type not null default 'immediate',
  status public.job_status not null default 'queued',
  priority public.priority not null default 'normal',
  payload jsonb not null default '{}',
  result jsonb,
  error_message text,
  retry_count int not null default 0 check (retry_count >= 0),
  max_retries int not null default 3 check (max_retries >= 0),
  scheduled_at timestamptz,
  available_at timestamptz not null default now(),
  claimed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

alter table public.workers add constraint workers_current_job_id_fkey foreign key (current_job_id) references public.jobs(id) on delete set null;

create table public.worker_heartbeats (
  id uuid primary key default gen_random_uuid(),
  worker_id uuid not null references public.workers(id) on delete cascade,
  status public.worker_status not null,
  load_average numeric not null default 0,
  memory_mb int not null default 0,
  created_at timestamptz not null default now()
);

create table public.job_executions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete set null,
  attempt int not null,
  status public.job_status not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms int,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.job_logs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  worker_id uuid references public.workers(id) on delete set null,
  level public.log_level not null default 'info',
  message text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.scheduled_jobs (
  id uuid primary key default gen_random_uuid(),
  queue_id uuid not null references public.queues(id) on delete cascade,
  name text not null,
  cron_expression text,
  payload jsonb not null default '{}',
  next_run_at timestamptz not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.dead_letter_queue (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  queue_id uuid not null references public.queues(id) on delete cascade,
  reason text not null,
  payload jsonb not null default '{}',
  failed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_table text not null,
  target_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table public.user_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  theme text not null default 'dark',
  notification_settings jsonb not null default '{"job_failed":true,"worker_offline":true,"queue_paused":true}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_projects_org on public.projects(organization_id) where deleted_at is null;
create index idx_queues_project on public.queues(project_id) where deleted_at is null;
create index idx_jobs_claim on public.jobs(status, available_at, priority, created_at) where deleted_at is null;
create index idx_jobs_queue_status on public.jobs(queue_id, status) where deleted_at is null;
create index idx_workers_project_status on public.workers(project_id, status) where deleted_at is null;
create index idx_job_logs_job_created on public.job_logs(job_id, created_at desc);
create index idx_notifications_user_unread on public.notifications(user_id, read_at) where read_at is null;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
create trigger projects_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger retry_policies_updated_at before update on public.retry_policies for each row execute function public.set_updated_at();
create trigger queues_updated_at before update on public.queues for each row execute function public.set_updated_at();
create trigger workers_updated_at before update on public.workers for each row execute function public.set_updated_at();
create trigger jobs_updated_at before update on public.jobs for each row execute function public.set_updated_at();
create trigger scheduled_jobs_updated_at before update on public.scheduled_jobs for each row execute function public.set_updated_at();
create trigger user_preferences_updated_at before update on public.user_preferences for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_preferences (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_org and user_id = auth.uid()
  );
$$;

create or replace function public.claim_next_job(target_worker_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.jobs;
begin
  update public.jobs
  set status = 'claimed',
      worker_id = target_worker_id,
      claimed_at = now(),
      updated_at = now()
  where id = (
    select j.id
    from public.jobs j
    join public.queues q on q.id = j.queue_id
    where j.deleted_at is null
      and q.deleted_at is null
      and q.status = 'active'
      and j.status in ('queued', 'retrying')
      and j.available_at <= now()
    order by
      case j.priority when 'critical' then 1 when 'high' then 2 when 'normal' then 3 else 4 end,
      j.created_at
    for update skip locked
    limit 1
  )
  returning * into claimed;

  if claimed.id is not null then
    update public.workers
    set status = 'online', current_job_id = claimed.id, last_heartbeat_at = now()
    where id = target_worker_id;
  end if;

  return claimed;
end;
$$;

create or replace function public.record_worker_heartbeat(target_worker_id uuid, worker_load numeric default 0, worker_memory int default 0)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.workers
  set status = 'online', last_heartbeat_at = now()
  where id = target_worker_id;

  insert into public.worker_heartbeats(worker_id, status, load_average, memory_mb)
  values (target_worker_id, 'online', worker_load, worker_memory);
end;
$$;

create or replace function public.complete_job(target_job_id uuid, target_worker_id uuid, job_result jsonb default '{}')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.jobs
  set status = 'completed', result = job_result, completed_at = now(), updated_at = now()
  where id = target_job_id and worker_id = target_worker_id;

  insert into public.job_logs(job_id, worker_id, level, message)
  values (target_job_id, target_worker_id, 'info', 'Job completed successfully');

  update public.workers set current_job_id = null where id = target_worker_id;
end;
$$;

create or replace function public.fail_job(target_job_id uuid, target_worker_id uuid, failure_message text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_job public.jobs;
  retry_delay int;
begin
  select * into current_job from public.jobs where id = target_job_id for update;
  retry_delay := least(60000, 1000 * power(2, current_job.retry_count));

  if current_job.retry_count < current_job.max_retries then
    update public.jobs
    set status = 'retrying',
        retry_count = retry_count + 1,
        error_message = failure_message,
        available_at = now() + make_interval(secs => retry_delay / 1000),
        updated_at = now()
    where id = target_job_id;

    insert into public.job_logs(job_id, worker_id, level, message)
    values (target_job_id, target_worker_id, 'warn', 'Retry scheduled: ' || failure_message);
  else
    update public.jobs
    set status = 'dead_letter', error_message = failure_message, completed_at = now(), updated_at = now()
    where id = target_job_id;

    insert into public.dead_letter_queue(job_id, queue_id, reason, payload)
    values (current_job.id, current_job.queue_id, failure_message, current_job.payload);

    insert into public.job_logs(job_id, worker_id, level, message)
    values (target_job_id, target_worker_id, 'error', 'Moved to dead letter queue: ' || failure_message);
  end if;

  update public.workers set current_job_id = null where id = target_worker_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.projects enable row level security;
alter table public.retry_policies enable row level security;
alter table public.queues enable row level security;
alter table public.workers enable row level security;
alter table public.worker_heartbeats enable row level security;
alter table public.jobs enable row level security;
alter table public.job_executions enable row level security;
alter table public.job_logs enable row level security;
alter table public.scheduled_jobs enable row level security;
alter table public.dead_letter_queue enable row level security;
alter table public.notifications enable row level security;
alter table public.activity_logs enable row level security;
alter table public.user_preferences enable row level security;

create policy "profiles self read" on public.profiles for select using (id = auth.uid());
create policy "profiles self update" on public.profiles for update using (id = auth.uid());
create policy "org member read" on public.organizations for select using (public.is_org_member(id));
create policy "org owner manage" on public.organizations for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "members read own orgs" on public.organization_members for select using (public.is_org_member(organization_id));
create policy "members insert by owner" on public.organization_members for insert with check (public.is_org_member(organization_id));

create policy "projects member access" on public.projects for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "retry policies member access" on public.retry_policies for all using (exists (select 1 from public.projects p where p.id = project_id and public.is_org_member(p.organization_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_org_member(p.organization_id)));
create policy "queues member access" on public.queues for all using (exists (select 1 from public.projects p where p.id = project_id and public.is_org_member(p.organization_id))) with check (exists (select 1 from public.projects p where p.id = project_id and public.is_org_member(p.organization_id)));
create policy "workers member read" on public.workers for select using (exists (select 1 from public.projects p where p.id = project_id and public.is_org_member(p.organization_id)));
create policy "worker heartbeats member read" on public.worker_heartbeats for select using (exists (select 1 from public.workers w join public.projects p on p.id = w.project_id where w.id = worker_id and public.is_org_member(p.organization_id)));
create policy "jobs member access" on public.jobs for all using (exists (select 1 from public.queues q join public.projects p on p.id = q.project_id where q.id = queue_id and public.is_org_member(p.organization_id))) with check (exists (select 1 from public.queues q join public.projects p on p.id = q.project_id where q.id = queue_id and public.is_org_member(p.organization_id)));
create policy "executions member read" on public.job_executions for select using (exists (select 1 from public.jobs j join public.queues q on q.id = j.queue_id join public.projects p on p.id = q.project_id where j.id = job_id and public.is_org_member(p.organization_id)));
create policy "logs member read" on public.job_logs for select using (exists (select 1 from public.jobs j join public.queues q on q.id = j.queue_id join public.projects p on p.id = q.project_id where j.id = job_id and public.is_org_member(p.organization_id)));
create policy "scheduled jobs member access" on public.scheduled_jobs for all using (exists (select 1 from public.queues q join public.projects p on p.id = q.project_id where q.id = queue_id and public.is_org_member(p.organization_id))) with check (exists (select 1 from public.queues q join public.projects p on p.id = q.project_id where q.id = queue_id and public.is_org_member(p.organization_id)));
create policy "dlq member read" on public.dead_letter_queue for select using (exists (select 1 from public.queues q join public.projects p on p.id = q.project_id where q.id = queue_id and public.is_org_member(p.organization_id)));
create policy "notifications user read" on public.notifications for select using (user_id = auth.uid() or public.is_org_member(organization_id));
create policy "notifications user update" on public.notifications for update using (user_id = auth.uid() or public.is_org_member(organization_id));
create policy "activity member read" on public.activity_logs for select using (public.is_org_member(organization_id));
create policy "preferences self access" on public.user_preferences for all using (user_id = auth.uid()) with check (user_id = auth.uid());

alter publication supabase_realtime add table public.jobs;
alter publication supabase_realtime add table public.queues;
alter publication supabase_realtime add table public.workers;
alter publication supabase_realtime add table public.job_logs;
alter publication supabase_realtime add table public.notifications;
