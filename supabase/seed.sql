insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000001',
  'demo@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  '{"full_name":"Demo Operator"}',
  now(),
  now()
) on conflict (id) do nothing;

insert into public.profiles (id, full_name)
values ('00000000-0000-0000-0000-000000000001', 'Demo Operator')
on conflict (id) do nothing;

insert into public.organizations (id, owner_id, name, slug)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Acme Platform', 'acme-platform')
on conflict (slug) do nothing;

insert into public.organization_members (organization_id, user_id, role)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'owner')
on conflict do nothing;

insert into public.projects (id, organization_id, name, description)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Billing Jobs', 'Invoices, webhooks, and reconciliation workloads.'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Media Pipeline', 'Video encoding and thumbnail processing.')
on conflict do nothing;

insert into public.retry_policies (id, project_id, name, strategy, max_retries, base_delay_ms, max_delay_ms)
values ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Default exponential', 'exponential', 5, 1000, 60000)
on conflict do nothing;

insert into public.queues (id, project_id, retry_policy_id, name, priority, concurrency)
values
  ('40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'billing-critical', 'critical', 10),
  ('40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', null, 'media-default', 'normal', 5)
on conflict do nothing;

insert into public.workers (id, project_id, name, status, last_heartbeat_at)
values
  ('50000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'worker-billing-1', 'online', now()),
  ('50000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'worker-media-1', 'offline', now() - interval '10 minutes')
on conflict do nothing;

insert into public.jobs (id, queue_id, name, type, status, priority, payload, retry_count, max_retries, completed_at)
values
  ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'send-invoice-email', 'immediate', 'queued', 'high', '{"invoiceId":"inv_001"}', 0, 5, null),
  ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'sync-payment-status', 'immediate', 'completed', 'normal', '{"paymentId":"pay_001"}', 1, 5, now()),
  ('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'encode-video', 'delayed', 'failed', 'normal', '{"assetId":"asset_001"}', 3, 3, now())
on conflict do nothing;

insert into public.job_logs (job_id, worker_id, level, message)
values
  ('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'info', 'Payment sync completed'),
  ('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'error', 'Encoder process exited with code 1');

insert into public.notifications (organization_id, user_id, type, title, message)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'job_failed', 'Job failed', 'encode-video exhausted retries and needs review.'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'worker_offline', 'Worker offline', 'worker-media-1 has missed heartbeats.');
