import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { AuthDialog } from '@/components/auth/AuthDialog'
import { endSession } from './session'
import { SESSION_EXPIRED_EVENT } from './sessionToken'

export type AuthMode = 'login' | 'register'

interface AuthDialogValue {
  openAuth: (mode?: AuthMode, notice?: string) => void
}

const AuthDialogContext = createContext<AuthDialogValue | null>(null)

export function AuthDialogProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<{ open: boolean; mode: AuthMode; notice?: string }>({
    open: false,
    mode: 'login',
  })

  const openAuth = useCallback((mode: AuthMode = 'login', notice?: string) => {
    setState({ open: true, mode, notice })
  }, [])

  useEffect(() => {
    function handleExpired() {
      endSession(queryClient)
      openAuth('login', 'Sua sessão expirou. Entre novamente para continuar de onde parou.')
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired)
  }, [queryClient, openAuth])

  const value = useMemo(() => ({ openAuth }), [openAuth])

  return (
    <AuthDialogContext.Provider value={value}>
      {children}
      <AuthDialog
        open={state.open}
        mode={state.mode}
        notice={state.notice}
        onModeChange={(mode) => setState((prev) => ({ ...prev, mode, notice: undefined }))}
        onOpenChange={(open) => setState((prev) => ({ ...prev, open }))}
      />
    </AuthDialogContext.Provider>
  )
}

export function useAuthDialog(): AuthDialogValue {
  const value = useContext(AuthDialogContext)
  if (!value) throw new Error('useAuthDialog precisa estar dentro de <AuthDialogProvider>')
  return value
}