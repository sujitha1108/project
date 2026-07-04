import { Command } from 'cmdk'
import {
  Activity,
  Bell,
  Briefcase,
  ChartNoAxesCombined,
  Gauge,
  ListChecks,
  Logs,
  Moon,
  Search,
  Server,
  Settings,
  Sun,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Button } from '@/shared/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useTheme } from '@/contexts/theme-context'
import { cn } from '@/shared/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Gauge },
  { to: '/projects', label: 'Projects', icon: Briefcase },
  { to: '/queues', label: 'Queues', icon: ListChecks },
  { to: '/jobs', label: 'Jobs', icon: Activity },
  { to: '/workers', label: 'Workers', icon: Server },
  { to: '/logs', label: 'Logs', icon: Logs },
  { to: '/analytics', label: 'Analytics', icon: ChartNoAxesCombined },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppLayout() {
  const [commandOpen, setCommandOpen] = useState(false)
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const commands = useMemo(() => navItems, [])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-card/85 backdrop-blur xl:block">
        <div className="flex h-16 items-center border-b px-5">
          <div>
            <p className="text-sm font-semibold">Distributed Scheduler</p>
            <p className="text-xs text-muted-foreground">Control plane</p>
          </div>
        </div>
        <nav className="space-y-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground',
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="xl:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur md:px-6">
          <Button
            type="button"
            variant="outline"
            className="h-9 flex-1 justify-start text-muted-foreground md:max-w-md"
            onClick={() => setCommandOpen(true)}
          >
            <Search className="size-4" />
            Global search
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
          <div className="ml-auto hidden text-right text-xs text-muted-foreground sm:block">
            {user?.email}
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void signOut()}
          >
            Sign out
          </Button>
        </header>
        <Outlet />
      </div>
      {commandOpen ? (
        <div className="fixed inset-0 z-50 bg-background/80 p-4 backdrop-blur">
          <Command className="mx-auto mt-24 max-w-xl overflow-hidden rounded-lg border bg-card shadow-2xl">
            <Command.Input
              autoFocus
              className="h-12 w-full border-b bg-transparent px-4 outline-none"
              placeholder="Search projects, queues, jobs, workers..."
              onKeyDown={(event) => {
                if (event.key === 'Escape') setCommandOpen(false)
              }}
            />
            <Command.List className="max-h-80 overflow-auto p-2">
              <Command.Empty className="p-4 text-sm text-muted-foreground">
                No results found.
              </Command.Empty>
              {commands.map((item) => (
                <Command.Item
                  key={item.to}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm aria-selected:bg-accent"
                  onSelect={() => {
                    navigate(item.to)
                    setCommandOpen(false)
                  }}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      ) : null}
    </div>
  )
}
