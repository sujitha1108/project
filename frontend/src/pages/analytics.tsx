import { useQuery } from '@tanstack/react-query'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getJobs, getWorkers } from '@/services/scheduler-service'
import { Page } from '@/shared/components/page'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'

export function AnalyticsPage() {
  const jobs = useQuery({ queryKey: ['jobs'], queryFn: () => getJobs() })
  const workers = useQuery({ queryKey: ['workers'], queryFn: getWorkers })
  const jobsData = (jobs.data ?? []).slice(0, 30).map((job) => ({
    day: new Date(job.created_at).toLocaleDateString(),
    success: job.status === 'completed' ? 1 : 0,
    failure: job.status === 'failed' ? 1 : 0,
    retry: job.retry_count,
  }))
  const workerData = (workers.data ?? []).map((worker) => ({
    name: worker.name,
    utilization: worker.status === 'online' ? 80 : 0,
  }))

  return (
    <Page
      title="Analytics"
      description="Track throughput, success rate, retry rate, worker utilization, and processing trends."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Jobs per day</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={jobsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Line dataKey="success" stroke="#22c55e" />
                <Line dataKey="failure" stroke="#ef4444" />
                <Line dataKey="retry" stroke="#f59e0b" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Worker utilization</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workerData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="utilization" fill="#0ea5e9" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </Page>
  )
}
