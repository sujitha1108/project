import { config } from '../config.js'
import { executeRegisteredJob } from '../jobs/registry.js'
import { logger } from '../utils/logger.js'
import { claimNextJob, completeJob, failJob, heartbeat } from '../services/worker-service.js'

export class JobWorker {
  private active = false
  private timer: NodeJS.Timeout | null = null

  start() {
    if (this.active) return
    this.active = true
    this.timer = setInterval(() => void this.tick(), config.pollIntervalMs)
    void this.tick()
  }

  stop() {
    this.active = false
    if (this.timer) clearInterval(this.timer)
  }

  private async tick() {
    try {
      await heartbeat(config.workerId)
      const job = await claimNextJob(config.workerId)
      if (!job?.id) return

      logger.info('claimed job', { jobId: job.id, name: job.name })
      const result = await executeRegisteredJob(job)
      await completeJob(config.workerId, job.id, result.output ?? {})
      logger.info('completed job', { jobId: job.id })
    } catch (error) {
      logger.error('worker tick failed', error instanceof Error ? error.message : error)
      if (error instanceof Error && 'jobId' in error) {
        await failJob(config.workerId, String(error.jobId), error.message)
      }
    }
  }
}
