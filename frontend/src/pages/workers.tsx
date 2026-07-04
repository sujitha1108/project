import { useQuery } from '@tanstack/react-query'
import { Server } from 'lucide-react'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { getWorkers } from '@/services/scheduler-service'
import { Page } from '@/shared/components/page'
import { Badge } from '@/shared/components/ui/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function WorkersPage() {
  useRealtimeTable('workers', ['workers', 'dashboard'])
  const workers = useQuery({ queryKey: ['workers'], queryFn: getWorkers })

  return (
    <Page
      title="Workers"
      description="Monitor worker leases, heartbeats, capacity, and offline status."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {(workers.data ?? []).map((worker) => (
          <Card key={worker.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Server className="size-4" />
                  {worker.name}
                </span>
                <Badge>{worker.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Current job: {worker.current_job_id ?? 'idle'}</p>
              <p>
                Heartbeat:{' '}
                {worker.last_heartbeat_at
                  ? new Date(worker.last_heartbeat_at).toLocaleString()
                  : 'never'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  )
}
