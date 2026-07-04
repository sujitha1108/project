import cron from 'node-cron'
import { config } from '../config.js'
import { supabase } from '../database/supabase.js'
import { logger } from '../utils/logger.js'

export function startCronScheduler() {
  cron.schedule(config.cronInterval, async () => {
    const { data, error } = await supabase
      .from('scheduled_jobs')
      .select('*')
      .eq('enabled', true)
      .lte('next_run_at', new Date().toISOString())

    if (error) {
      logger.error('scheduled job scan failed', error.message)
      return
    }

    for (const scheduled of data ?? []) {
      await supabase.from('jobs').insert({
        queue_id: scheduled.queue_id,
        name: scheduled.name,
        type: scheduled.cron_expression ? 'recurring' : 'scheduled',
        status: 'queued',
        payload: scheduled.payload,
      })
      logger.info('materialized scheduled job', { scheduledJobId: scheduled.id })
    }
  })
}
