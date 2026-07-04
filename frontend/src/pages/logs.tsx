import { useQuery } from '@tanstack/react-query'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { getLogs } from '@/services/scheduler-service'
import { Page } from '@/shared/components/page'
import { Badge } from '@/shared/components/ui/badge'
import { Card, CardContent } from '@/shared/components/ui/card'

export function LogsPage() {
  useRealtimeTable('job_logs', ['logs'])
  const logs = useQuery({ queryKey: ['logs'], queryFn: getLogs })

  return (
    <Page
      title="Execution Logs"
      description="Inspect execution history, retries, worker output, and failure traces."
    >
      <Card>
        <CardContent className="divide-y p-0">
          {(logs.data ?? []).map((log) => (
            <div
              key={log.id}
              className="grid gap-2 p-4 md:grid-cols-[120px_1fr_220px]"
            >
              <Badge>{log.level}</Badge>
              <p className="font-mono text-sm">{log.message}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </Page>
  )
}
