import type { ReactNode } from 'react'

interface StatePanelProps {
  title: string
  description?: string
  action?: ReactNode
  role?: 'status' | 'alert'
}

export function StatePanel({ title, description, action, role = 'status' }: StatePanelProps) {
  return (
    <div role={role} className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  )
}