import type { CreateOrderInput, Order } from '@/types/order'
import type { Wallet } from '@/types/wallet'
import { httpClient } from './httpClient'

export async function fetchWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const { data } = await httpClient.get<Wallet[]>('/wallets', { signal })
  return data
}

export async function connectWallet(walletId: string): Promise<void> {
  await httpClient.post(`/wallets/${encodeURIComponent(walletId)}/connect`)
}

export async function createOrder(input: CreateOrderInput, idempotencyKey: string): Promise<Order> {
  const { data } = await httpClient.post<Order>('/orders', input, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}

export async function fetchOrder(orderId: string, signal?: AbortSignal): Promise<Order> {
  const { data } = await httpClient.get<Order>(`/orders/${encodeURIComponent(orderId)}`, { signal })
  return data
}