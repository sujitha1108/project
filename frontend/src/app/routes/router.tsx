import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from '@/layouts/app-layout'
import { ProtectedRoute } from '@/layouts/protected-route'
import { AnalyticsPage } from '@/pages/analytics'
import { AuthPage } from '@/pages/auth'
import { DashboardPage } from '@/pages/dashboard'
import { JobsPage } from '@/pages/jobs'
import { LogsPage } from '@/pages/logs'
import { NotificationsPage } from '@/pages/notifications'
import { ProjectsPage } from '@/pages/projects'
import { QueuesPage } from '@/pages/queues'
import { SettingsPage } from '@/pages/settings'
import { WorkersPage } from '@/pages/workers'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'queues', element: <QueuesPage /> },
      { path: 'jobs', element: <JobsPage /> },
      { path: 'workers', element: <WorkersPage /> },
      { path: 'logs', element: <LogsPage /> },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
])
