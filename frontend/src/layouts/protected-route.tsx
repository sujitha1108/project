import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/auth-context'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { loading, session } = useAuth()

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">Loading...</div>
    )
  }

  if (!session) return <Navigate to="/auth" replace />

  return children
}
