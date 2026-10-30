import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/httpClient'

function isTransient(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  return error.code === 'NETWORK' || error.code === 'UNAVAILABLE' || error.status >= 500
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => isTransient(error) && failureCount < 2,
    },
    mutations: {
      retry: false,
    },
  },
})