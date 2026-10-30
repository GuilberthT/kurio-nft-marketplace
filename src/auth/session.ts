import { queryOptions, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { fetchSession, login, logout, register } from '@/api/auth'
import { mergeGuestCart } from '@/api/cart'
import { getGuestCartId } from '@/cart/guestCartId'
import { ApiError } from '@/api/httpClient'
import type { Session } from '@/types/user'
import { clearSessionToken, getSessionToken, setSessionToken } from './sessionToken'

export const sessionKey = ['session'] as const
export const privateKey = (userId: string) => ['private', userId] as const

export function sessionQuery() {
  return queryOptions({
    queryKey: sessionKey,
    queryFn: async ({ signal }): Promise<Session | null> => {
      if (!getSessionToken()) return null
      try {
        return await fetchSession(signal)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          clearSessionToken()
          return null
        }
        throw error
      }
    },
    staleTime: Infinity,
  })
}

export function useSession() {
  const session = useQuery(sessionQuery())
  return {
    session: session.data ?? null,
    user: session.data?.user ?? null,
    isLoading: session.isPending,
  }
}

export function endSession(queryClient: QueryClient): void {
  clearSessionToken()
  queryClient.removeQueries({ queryKey: ['private'] })
  queryClient.setQueryData(sessionKey, null)
}

async function startSession(queryClient: QueryClient, session: Session): Promise<void> {
  queryClient.removeQueries({ queryKey: ['private'] })
  setSessionToken(session.token)
  try {
    const quote = await mergeGuestCart(getGuestCartId())
    queryClient.setQueryData([...privateKey(session.user.id), 'cart'], quote)
  } catch {
     // Se a junção falhar, o login continua; o carrinho é buscado de novo depois.
  }
  queryClient.removeQueries({ queryKey: ['guest-cart'] })
  queryClient.setQueryData(sessionKey, session)
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: login,
    onSuccess: (session) => startSession(queryClient, session),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: register,
    onSuccess: (session) => startSession(queryClient, session),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: logout,
    onSettled: () => endSession(queryClient),
  })
}