import type { RefObject } from 'react'
import type { AuthMode } from '@/auth/AuthDialogContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'

interface AuthDialogProps {
  open: boolean
  mode: AuthMode
  notice?: string
  onModeChange: (mode: AuthMode) => void
  onOpenChange: (open: boolean) => void
  returnFocus: RefObject<HTMLElement | null>
}

const DESCRIPTIONS: Record<AuthMode, string> = {
  login: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
  register: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
}

export function AuthDialog({ open, mode, notice, onModeChange, onOpenChange, returnFocus }: AuthDialogProps) {
  const close = () => onOpenChange(false)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent
        className="max-h-[90dvh] overflow-y-auto border-border bg-card sm:max-w-125"
        onCloseAutoFocus={(event) => {
          const target = returnFocus.current
          if (target?.isConnected) {
            event.preventDefault()
            target.focus()
          }
        }}
      >
        <DialogHeader className="items-center text-center">
          <DialogTitle className="flex items-center gap-3 text-xl">
            {(['login', 'register'] as const).map((item, index) => (
              <span key={item} className="flex items-center gap-3">
                {index > 0 && <span aria-hidden className="h-6 w-px bg-primary" />}
                <button
                  type="button"
                  onClick={() => onModeChange(item)}
                  aria-pressed={mode === item}
                  className={cn(
                    'rounded px-1 focus-visible:outline-2 focus-visible:outline-ring',
                    mode === item ? 'text-primary' : 'hover:text-primary',
                  )}
                >
                  {item === 'login' ? 'Entrar' : 'Criar conta'}
                </button>
              </span>
            ))}
          </DialogTitle>
          <DialogDescription className="mt-4 text-sm">{DESCRIPTIONS[mode]}</DialogDescription>
        </DialogHeader>

        {notice && (
          <p role="status" className="rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm">
            {notice}
          </p>
        )}

        <div className="px-0 sm:px-8">
          {mode === 'login' ? <LoginForm onSuccess={close} /> : <RegisterForm onSuccess={close} />}
        </div>

        <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
          Ou continue com
        </div>
        <div className="space-y-3 px-0 sm:px-8">
          {['Google', 'Facebook'].map((provider) => (
            <Button key={provider} type="button" variant="outline" className="h-10 w-full" disabled title="Em breve">
              Continuar com {provider}
              <span className="sr-only"> (em breve)</span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}