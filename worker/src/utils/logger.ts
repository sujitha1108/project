export const logger = {
  info(message: string, metadata?: unknown) {
    console.log(JSON.stringify({ level: 'info', message, metadata, time: new Date().toISOString() }))
  },
  warn(message: string, metadata?: unknown) {
    console.warn(JSON.stringify({ level: 'warn', message, metadata, time: new Date().toISOString() }))
  },
  error(message: string, metadata?: unknown) {
    console.error(JSON.stringify({ level: 'error', message, metadata, time: new Date().toISOString() }))
  },
}
