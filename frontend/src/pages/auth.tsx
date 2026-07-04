import { zodResolver } from '@hookform/resolvers/zod'
import { Boxes } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Navigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/shared/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

const authSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
})

type AuthForm = z.infer<typeof authSchema>

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login')
  const {
    session,
    signInWithEmail,
    signInWithGoogle,
    signUpWithEmail,
    resetPassword,
  } = useAuth()
  const form = useForm<AuthForm>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: '', password: '' },
  })

  if (session) return <Navigate to="/" replace />

  async function onSubmit(values: AuthForm) {
    try {
      if (mode !== 'reset' && !values.password) {
        toast.error('Password is required')
        return
      }
      if (mode === 'login')
        await signInWithEmail(values.email, values.password ?? '')
      if (mode === 'signup')
        await signUpWithEmail(values.email, values.password ?? '')
      if (mode === 'reset') await resetPassword(values.email)
      toast.success(mode === 'reset' ? 'Reset email sent' : 'Welcome')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Authentication failed',
      )
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-3 flex size-11 items-center justify-center rounded-md border">
            <Boxes className="size-5" />
          </div>
          <CardTitle>Distributed Job Scheduler</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sign in to manage queues, workers, and asynchronous jobs.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-3" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-1">
              <Input placeholder="Email" {...form.register('email')} />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            {mode !== 'reset' ? (
              <div className="space-y-1">
                <Input
                  type="password"
                  placeholder="Password"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
            ) : null}
            <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
              {mode === 'login'
                ? 'Sign in'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Send reset'}
            </Button>
          </form>
          <Button
            className="w-full"
            type="button"
            variant="outline"
            onClick={() => void signInWithGoogle()}
          >
            Continue with Google
          </Button>
          <div className="flex justify-between text-xs text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup')
                form.clearErrors()
              }}
            >
              {mode === 'signup' ? 'Have an account?' : 'Create account'}
            </button>
            <button type="button" onClick={() => {
              setMode('reset')
              form.clearErrors()
            }}>
              Reset password
            </button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
