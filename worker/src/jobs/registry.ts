import type { ClaimedJob, JobResult } from './types.js'

type Handler = (job: ClaimedJob) => Promise<JobResult>

const handlers = new Map<string, Handler>()

handlers.set('send-invoice-email', async (job) => ({
  ok: true,
  output: { delivered: true, invoiceId: job.payload.invoiceId },
}))

handlers.set('sync-payment-status', async (job) => ({
  ok: true,
  output: { synced: true, paymentId: job.payload.paymentId },
}))

handlers.set('encode-video', async (job) => ({
  ok: true,
  output: { encoded: true, assetId: job.payload.assetId },
}))

export async function executeRegisteredJob(job: ClaimedJob) {
  const handler = handlers.get(job.name) ?? defaultHandler
  return handler(job)
}

async function defaultHandler(job: ClaimedJob): Promise<JobResult> {
  return {
    ok: true,
    output: {
      handledBy: 'default',
      jobName: job.name,
    },
  }
}
