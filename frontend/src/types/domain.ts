export type JobStatus =
  | 'queued'
  | 'scheduled'
  | 'claimed'
  | 'running'
  | 'completed'
  | 'failed'
  | 'retrying'
  | 'dead_letter'

export type QueueStatus = 'active' | 'paused' | 'archived'
export type WorkerStatus = 'online' | 'offline' | 'draining'
export type Priority = 'low' | 'normal' | 'high' | 'critical'

export interface Organization {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Project {
  id: string
  organization_id: string
  name: string
  description: string | null
  status: 'active' | 'archived'
  created_at: string
}

export interface Queue {
  id: string
  project_id: string
  retry_policy_id: string | null
  name: string
  status: QueueStatus
  priority: Priority
  concurrency: number
  created_at: string
}

export interface Job {
  id: string
  queue_id: string
  worker_id: string | null
  name: string
  type: 'immediate' | 'delayed' | 'scheduled' | 'recurring' | 'batch'
  status: JobStatus
  priority: Priority
  retry_count: number
  max_retries: number
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface WorkerNode {
  id: string
  project_id: string
  name: string
  status: WorkerStatus
  current_job_id: string | null
  last_heartbeat_at: string | null
  created_at: string
}

export interface JobLog {
  id: string
  job_id: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  created_at: string
}

export interface Notification {
  id: string
  organization_id: string
  title: string
  message: string
  type: string
  read_at: string | null
  created_at: string
}

export interface DashboardMetrics {
  totalJobs: number
  queued: number
  running: number
  completed: number
  failed: number
  deadLetter: number
  workersOnline: number
  workersOffline: number
  successRate: number
  retryRate: number
}
