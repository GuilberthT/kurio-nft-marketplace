import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { connectWallet, createOrder, fetchOrder, fetchWallets } from '@/api/orders'
import { ApiError } from '@/api/httpClient'
import { privateKey, useSession } from '@/auth/session'
import { cartKey } from '@/cart/useCart'
import type { CreateOrderInput } from '@/types/order'
import { getIdempotencyKey } from './idempotency'

export function useWallets() {
  const { user } = useSession()
  return useQuery({
    queryKey: [...privateKey(user?.id ?? 'anon'), 'wallets'],
    queryFn: ({ signal }) => fetchWallets(signal),
    enabled: Boolean(user),
  })
}

export function useConnectWallet() {
  return useMutation({ mutationFn: connectWallet })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn: (input: CreateOrderInput) => createOrder(input, getIdempotencyKey(input)),
    onError: (error) => {
      // Cotação desatualizada: busca os valores novos para o usuário revisar.
      if (error instanceof ApiError && error.code === 'STALE_QUOTE') {
        void queryClient.invalidateQueries({ queryKey: cartKey(user?.id ?? null) })
      }
    },
  })
}

export function orderKey(userId: string, orderId: string) {
  return [...privateKey(userId), 'order', orderId] as const
}

export function useOrder(orderId: string) {
  const { user } = useSession()
  return useQuery({
    queryKey: orderKey(user?.id ?? 'anon', orderId),
    queryFn: ({ signal }) => fetchOrder(orderId, signal),
    enabled: Boolean(user),
    // Enquanto pendente, consulta de novo a cada 3s (o Socket.IO avisa antes, quando conectado).
    refetchInterval: (query) => (query.state.data?.status === 'pending' ? 3000 : false),
  })
}