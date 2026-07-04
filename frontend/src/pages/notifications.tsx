import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell } from 'lucide-react'
import { useRealtimeTable } from '@/hooks/use-realtime-table'
import {
  getNotifications,
  markNotificationRead,
} from '@/services/scheduler-service'
import { Page } from '@/shared/components/page'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'

export function NotificationsPage() {
  useRealtimeTable('notifications', ['notifications'])
  const queryClient = useQueryClient()
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: getNotifications,
  })
  const read = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () =>
      void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })

  return (
    <Page
      title="Notifications"
      description="Job failures, completions, worker outages, queue pauses, and retry events."
    >
      <Card>
        <CardContent className="divide-y p-0">
          {(notifications.data ?? []).map((notification) => (
            <div
              key={notification.id}
              className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex gap-3">
                <Bell className="mt-1 size-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{notification.type}</Badge>
                {!notification.read_at ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => read.mutate(notification.id)}
                  >
                    Mark read
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </Page>
  )
}
