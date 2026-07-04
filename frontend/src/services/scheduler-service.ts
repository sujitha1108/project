import { supabase } from '@/lib/supabase'
import type {
  DashboardMetrics,
  Job,
  JobLog,
  Notification,
  Project,
  Queue,
  WorkerNode,
} from '@/types/domain'

export async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Project[]
}

export async function createProject(input: {
  organization_id: string
  name: string
  description?: string
}) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...input, status: 'active' })
    .select()
    .single()

  if (error) throw error
  return data as unknown as Project
}

export async function archiveProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .update({ status: 'archived' })
    .eq('id', id)

  if (error) throw error
}

export async function getQueues() {
  const { data, error } = await supabase
    .from('queues')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Queue[]
}

export async function createQueue(input: {
  project_id: string
  name: string
  concurrency: number
  priority: string
}) {
  const { data, error } = await supabase
    .from('queues')
    .insert({ ...input, status: 'active' })
    .select()
    .single()

  if (error) throw error
  return data as unknown as Queue
}

export async function updateQueueStatus(id: string, status: Queue['status']) {
  const { error } = await supabase
    .from('queues')
    .update({ status })
    .eq('id', id)
  if (error) throw error
}

export async function getJobs(filters?: { status?: string; queueId?: string }) {
  let query = supabase
    .from('jobs')
    .select('*')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.queueId) query = query.eq('queue_id', filters.queueId)

  const { data, error } = await query
  if (error) throw error
  return (data ?? []) as unknown as Job[]
}

export async function enqueueJob(input: {
  queue_id: string
  name: string
  type: Job['type']
  priority: Job['priority']
  payload: Record<string, unknown>
  scheduled_at?: string | null
}) {
  const { data, error } = await supabase
    .from('jobs')
    .insert({
      ...input,
      status: input.scheduled_at ? 'scheduled' : 'queued',
      max_retries: 3,
      retry_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data as unknown as Job
}

export async function getWorkers() {
  const { data, error } = await supabase
    .from('workers')
    .select('*')
    .is('deleted_at', null)
    .order('last_heartbeat_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as WorkerNode[]
}

export async function getLogs() {
  const { data, error } = await supabase
    .from('job_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw error
  return (data ?? []) as unknown as JobLog[]
}

export async function getNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as unknown as Notification[]
}

export async function markNotificationRead(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [jobs, workers] = await Promise.all([getJobs(), getWorkers()])
  const totalJobs = jobs.length
  const completed = jobs.filter((job) => job.status === 'completed').length
  const retried = jobs.filter((job) => job.retry_count > 0).length

  return {
    totalJobs,
    queued: jobs.filter((job) => job.status === 'queued').length,
    running: jobs.filter((job) => job.status === 'running').length,
    completed,
    failed: jobs.filter((job) => job.status === 'failed').length,
    deadLetter: jobs.filter((job) => job.status === 'dead_letter').length,
    workersOnline: workers.filter((worker) => worker.status === 'online')
      .length,
    workersOffline: workers.filter((worker) => worker.status === 'offline')
      .length,
    successRate: totalJobs ? Math.round((completed / totalJobs) * 100) : 0,
    retryRate: totalJobs ? Math.round((retried / totalJobs) * 100) : 0,
  }
}
