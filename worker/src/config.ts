import 'dotenv/config'

function required(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`Missing required environment variable: ${name}`)
  return value
}

export const config = {
  supabaseUrl: required('SUPABASE_URL'),
  serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY'),
  projectId: required('PROJECT_ID'),
  workerId: process.env.WORKER_ID ?? crypto.randomUUID(),
  workerName: process.env.WORKER_NAME ?? `worker-${process.pid}`,
  pollIntervalMs: Number(process.env.WORKER_POLL_INTERVAL ?? 5000),
  cronInterval: process.env.CRON_INTERVAL ?? '* * * * *',
  logLevel: process.env.LOG_LEVEL ?? 'info',
}
