import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { enqueueJob, getJobs, getQueues } from '@/services/scheduler-service'
import { Page } from '@/shared/components/page'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

const schema = z.object({
  queue_id: z.string().uuid('Queue must be selected'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['immediate', 'delayed', 'scheduled', 'recurring', 'batch']),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
  payload: z.string().min(2, 'Payload is required').refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  }, { message: 'Invalid JSON format' }),
})

export function JobsPage() {
  useRealtimeTable('jobs', ['jobs', 'dashboard'])
  const [status, setStatus] = useState('')
  const queryClient = useQueryClient()
  const queues = useQuery({ queryKey: ['queues'], queryFn: getQueues })
  const jobs = useQuery({
    queryKey: ['jobs', status],
    queryFn: () => getJobs({ status: status || undefined }),
  })
  
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      queue_id: '',
      name: '',
      type: 'immediate',
      priority: 'normal',
      payload: '{}',
    },
  })
  
  const create = useMutation({
    mutationFn: (values: z.infer<typeof schema>) =>
      enqueueJob({
        ...values,
        payload: JSON.parse(values.payload) as Record<string, unknown>,
      }),
    onSuccess: () => {
      toast.success('Job enqueued')
      form.reset()
      void queryClient.invalidateQueries({ queryKey: ['jobs'] })
    },
    onError: (error) => {
      toast.error('Failed to enqueue job')
      console.error(error)
    }
  })

  return (
    <Page
      title="Jobs"
      description="Search and filter immediate, delayed, scheduled, recurring, and batch jobs."
    >
      <Card>
        <CardHeader>
          <CardTitle>Enqueue job</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-6"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
          >
            <div className="space-y-1">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register('queue_id')}
              >
                <option value="" disabled>
                  Select Queue
                </option>
                {(queues.data ?? []).map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.queue_id && (
                <p className="text-xs text-destructive">{form.formState.errors.queue_id.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Input placeholder="Job name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register('type')}
              >
                <option value="immediate">Immediate</option>
                <option value="delayed">Delayed</option>
                <option value="scheduled">Scheduled</option>
                <option value="recurring">Recurring</option>
                <option value="batch">Batch</option>
              </select>
              {form.formState.errors.type && (
                <p className="text-xs text-destructive">{form.formState.errors.type.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register('priority')}
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              {form.formState.errors.priority && (
                <p className="text-xs text-destructive">{form.formState.errors.priority.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Input
                placeholder='{"hello":"world"}'
                {...form.register('payload')}
              />
              {form.formState.errors.payload && (
                <p className="text-xs text-destructive">{form.formState.errors.payload.message}</p>
              )}
            </div>

            <Button type="submit" disabled={create.isPending || queues.isLoading}>
              <Plus className="size-4" />
              Enqueue
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="flex gap-2">
        {['', 'queued', 'running', 'completed', 'failed', 'dead_letter'].map(
          (item) => (
            <Button
              key={item || 'all'}
              type="button"
              variant={status === item ? 'default' : 'outline'}
              onClick={() => setStatus(item)}
            >
              {item || 'all'}
            </Button>
          ),
        )}
      </div>
      
      <Card>
        <CardContent className="overflow-auto p-0">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="p-3">Name</th>
                <th>Status</th>
                <th>Type</th>
                <th>Priority</th>
                <th>Retries</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {(jobs.data ?? []).map((job) => (
                <tr key={job.id} className="border-b">
                  <td className="p-3 font-medium">{job.name}</td>
                  <td>
                    <Badge>{job.status}</Badge>
                  </td>
                  <td>{job.type}</td>
                  <td>{job.priority}</td>
                  <td>
                    {job.retry_count}/{job.max_retries}
                  </td>
                  <td>{new Date(job.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </Page>
  )
}
