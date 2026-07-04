import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  CircleCheck,
  CircleX,
  Clock,
  Repeat,
  Server,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { getDashboardMetrics, getJobs } from '@/services/scheduler-service'
import { Page } from '@/shared/components/page'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number | string
  icon: typeof Activity
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{label}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  useRealtimeTable('jobs', ['dashboard', 'jobs'])
  useRealtimeTable('workers', ['dashboard', 'workers'])

  const metrics = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardMetrics,
  })
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() })

  const chartData = (jobs.data ?? [])
    .slice(0, 24)
    .reverse()
    .map((job, index) => ({
      name: `T-${24 - index}`,
      completed: job.status === 'completed' ? 1 : 0,
      failed: job.status === 'failed' ? 1 : 0,
      retries: job.retry_count,
    }))

  return (
    <Page
      title="Dashboard"
      description="Realtime operational health for jobs, queues, and workers."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total jobs"
          value={metrics.data?.totalJobs ?? 0}
          icon={Activity}
        />
        <MetricCard
          label="Queued"
          value={metrics.data?.queued ?? 0}
          icon={Clock}
        />
        <MetricCard
          label="Running"
          value={metrics.data?.running ?? 0}
          icon={Repeat}
        />
        <MetricCard
          label="Completed"
          value={metrics.data?.completed ?? 0}
          icon={CircleCheck}
        />
        <MetricCard
          label="Failed"
          value={metrics.data?.failed ?? 0}
          icon={CircleX}
        />
        <MetricCard
          label="Dead letter"
          value={metrics.data?.deadLetter ?? 0}
          icon={CircleX}
        />
        <MetricCard
          label="Workers online"
          value={metrics.data?.workersOnline ?? 0}
          icon={Server}
        />
        <MetricCard
          label="Success rate"
          value={`${metrics.data?.successRate ?? 0}%`}
          icon={CircleCheck}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Queue throughput and failures</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Area
                dataKey="completed"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.18}
              />
              <Area
                dataKey="failed"
                stroke="#ef4444"
                fill="#ef4444"
                fillOpacity={0.18}
              />
              <Area
                dataKey="retries"
                stroke="#f59e0b"
                fill="#f59e0b"
                fillOpacity={0.18}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Page>
  )
}
