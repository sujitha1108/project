import os from 'node:os'
import { config } from '../config.js'
import { supabase } from '../database/supabase.js'
import type { ClaimedJob } from '../jobs/types.js'

export async function registerWorker(workerId: string, name: string) {
  const { error } = await supabase.from('workers').upsert({
    id: workerId,
    project_id: config.projectId,
    name,
    status: 'online',
    last_heartbeat_at: new Date().toISOString(),
    metadata: { pid: process.pid, hostname: os.hostname() },
  })

  if (error) throw error
}

export async function heartbeat(workerId: string) {
  const loadAverage = os.loadavg()[0] ?? 0
  const memoryMb = Math.round((os.totalmem() - os.freemem()) / 1024 / 1024)
  const { error } = await supabase.rpc('record_worker_heartbeat', {
    target_worker_id: workerId,
    worker_load: loadAverage,
    worker_memory: memoryMb,
  })

  if (error) throw error
}

export async function claimNextJob(workerId: string) {
  const { data, error } = await supabase.rpc('claim_next_job', {
    target_worker_id: workerId,
  })

  if (error) throw error
  return data as ClaimedJob | null
}

export async function completeJob(workerId: string, jobId: string, result: Record<string, unknown>) {
  const { error } = await supabase.rpc('complete_job', {
    target_worker_id: workerId,
    target_job_id: jobId,
    job_result: result,
  })

  if (error) throw error
}

export async function failJob(workerId: string, jobId: string, message: string) {
  const { error } = await supabase.rpc('fail_job', {
    target_worker_id: workerId,
    target_job_id: jobId,
    failure_message: message,
  })

  if (error) throw error
}
