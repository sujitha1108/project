import { useAuth } from '@/contexts/auth-context'
import { Page } from '@/shared/components/page'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

export function SettingsPage() {
  const { user } = useAuth()

  return (
    <Page
      title="Settings"
      description="Profile, organization preferences, notification delivery, and API configuration."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={user?.email ?? ''} readOnly />
            <p className="text-sm text-muted-foreground">
              Profile rows are synchronized by the Supabase auth trigger.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Job failed notifications
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" defaultChecked /> Worker offline alerts
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" /> Queue paused digest
            </label>
          </CardContent>
        </Card>
      </div>
    </Page>
  )
}
