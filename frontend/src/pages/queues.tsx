import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pause, Play, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import {
  createQueue,
  getProjects,
  getQueues,
  updateQueueStatus,
} from '@/services/scheduler-service'
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
  project_id: z.string().uuid('Project must be selected'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  concurrency: z.number().int().min(1, 'Min 1').max(100, 'Max 100'),
  priority: z.enum(['low', 'normal', 'high', 'critical']),
})

type QueueForm = z.infer<typeof schema>

export function QueuesPage() {
  useRealtimeTable('queues', ['queues', 'dashboard'])
  const queryClient = useQueryClient()
  const projects = useQuery({ queryKey: ['projects'], queryFn: getProjects })
  const queues = useQuery({ queryKey: ['queues'], queryFn: getQueues })
  
  const form = useForm<QueueForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: '',
      name: '',
      concurrency: 5,
      priority: 'normal',
    },
  })
  
  const create = useMutation({
    mutationFn: createQueue,
    onSuccess: () => {
      toast.success('Queue created')
      form.reset()
      void queryClient.invalidateQueries({ queryKey: ['queues'] })
    },
    onError: (error) => {
      toast.error('Failed to create queue')
      console.error(error)
    }
  })
  
  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'active' | 'paused' }) =>
      updateQueueStatus(id, status),
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['queues'] }),
    onError: (error) => {
      toast.error('Failed to update queue status')
      console.error(error)
    }
  })

  return (
    <Page
      title="Queues"
      description="Manage queue concurrency, priority, retry policy, health, and pause state."
    >
      <Card>
        <CardHeader>
          <CardTitle>New queue</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-5"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
          >
            <div className="space-y-1">
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...form.register('project_id')}
              >
                <option value="" disabled>
                  Select Project
                </option>
                {(projects.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.project_id && (
                <p className="text-xs text-destructive">{form.formState.errors.project_id.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Input placeholder="Queue name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            
            <div className="space-y-1">
              <Input
                type="number"
                placeholder="Concurrency"
                {...form.register('concurrency', { valueAsNumber: true })}
              />
              {form.formState.errors.concurrency && (
                <p className="text-xs text-destructive">{form.formState.errors.concurrency.message}</p>
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
            
            <Button type="submit" disabled={create.isPending || projects.isLoading}>
              <Plus className="size-4" />
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
      
      <div className="grid gap-4 xl:grid-cols-3">
        {(queues.data ?? []).map((queue) => (
          <Card key={queue.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {queue.name}
                <Badge>{queue.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-3 text-muted-foreground">
                <span>Priority: {queue.priority}</span>
                <span>Concurrency: {queue.concurrency}</span>
                <span>Health: nominal</span>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  setStatus.mutate({
                    id: queue.id,
                    status: queue.status === 'paused' ? 'active' : 'paused',
                  })
                }
                disabled={setStatus.isPending && setStatus.variables?.id === queue.id}
              >
                {queue.status === 'paused' ? (
                  <Play className="size-4" />
                ) : (
                  <Pause className="size-4" />
                )}
                {queue.status === 'paused' ? 'Resume' : 'Pause'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  )
}
