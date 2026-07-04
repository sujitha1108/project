import type { PropsWithChildren, ReactNode } from 'react'

interface PageProps extends PropsWithChildren {
  title: string
  description: string
  actions?: ReactNode
}

export function Page({ title, description, actions, children }: PageProps) {
  return (
    <main className="space-y-6 p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>
      {children}
    </main>
  )
}
