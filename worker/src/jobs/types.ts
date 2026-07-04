export interface ClaimedJob {
  id: string
  queue_id: string
  worker_id: string
  name: string
  type: string
  payload: Record<string, unknown>
  retry_count: number
  max_retries: number
}

export interface JobResult {
  ok: boolean
  output?: Record<string, unknown>
}
