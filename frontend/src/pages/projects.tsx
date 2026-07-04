import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Plus } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import { useWorkspace } from '@/hooks/use-workspace'
import {
  archiveProject,
  createProject,
  getProjects,
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
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
})

type ProjectForm = z.infer<typeof schema>

export function ProjectsPage() {
  useRealtimeTable('projects', ['projects', 'dashboard'])
  const queryClient = useQueryClient()
  const workspace = useWorkspace()
  const projects = useQuery({ queryKey: ['projects'], queryFn: getProjects })
  
  const form = useForm<ProjectForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  })
  
  const create = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      toast.success('Project created')
      form.reset()
      void queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
    onError: (error) => {
      toast.error('Failed to create project')
      console.error(error)
    }
  })

  const archive = useMutation({
    mutationFn: archiveProject,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['projects'] }),
    onError: (error) => {
      toast.error('Failed to archive project')
      console.error(error)
    }
  })

  return (
    <Page
      title="Projects"
      description="Create, duplicate, archive, delete, and monitor project statistics."
    >
      <Card>
        <CardHeader>
          <CardTitle>New project</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-4"
            onSubmit={form.handleSubmit((values) => {
              if (!workspace.data) {
                toast.error('Workspace not found')
                return
              }
              create.mutate({
                ...values,
                organization_id: workspace.data.organization_id
              })
            })}
          >
            <div className="space-y-1">
              <Input placeholder="Project name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-1 md:col-span-2">
              <Input
                placeholder="Description"
                {...form.register('description')}
              />
              {form.formState.errors.description && (
                <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>
            <Button type="submit" disabled={create.isPending || workspace.isLoading}>
              <Plus className="size-4" />
              Create
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 xl:grid-cols-2">
        {(projects.data ?? []).map((project) => (
          <Card key={project.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {project.name}
                <Badge>{project.status}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>{project.description ?? 'No description'}</p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigator.clipboard.writeText(project.id)}
                >
                  <Copy className="size-4" />
                  Copy ID
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => archive.mutate(project.id)}
                  disabled={archive.isPending}
                >
                  Archive
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  )
}
