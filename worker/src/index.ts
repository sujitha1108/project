import { config } from './config.js'
import { startCronScheduler } from './scheduler/cron-scheduler.js'
import { registerWorker } from './services/worker-service.js'
import { JobWorker } from './workers/job-worker.js'
import { logger } from './utils/logger.js'

const worker = new JobWorker()

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

async function main() {
  await registerWorker(config.workerId, config.workerName)
  startCronScheduler()
  worker.start()
  logger.info('worker started', { workerId: config.workerId, name: config.workerName })
}

function shutdown() {
  worker.stop()
  logger.info('worker stopped')
  process.exit(0)
}

void main().catch((error) => {
  logger.error('worker failed to start', error instanceof Error ? error.message : error)
  process.exit(1)
})
