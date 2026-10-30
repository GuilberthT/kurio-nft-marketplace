import type { CartItem, Quote } from '@/types/cart'
import { httpClient } from './httpClient'

export async function fetchCart(signal?: AbortSignal): Promise<Quote> {
  const { data } = await httpClient.get<Quote>('/cart', { signal })
  return data
}

export async function addCartItem(item: CartItem): Promise<Quote> {
  const { data } = await httpClient.post<Quote>('/cart/items', item)
  return data
}

export async function updateCartItem(item: CartItem): Promise<Quote> {
  const { data } = await httpClient.patch<Quote>('/cart/items', item)
  return data
}

export async function removeCartItem(item: Pick<CartItem, 'nftId' | 'edition'>): Promise<Quote> {
  const { data } = await httpClient.delete<Quote>('/cart/items', { params: item })
  return data
}

export async function applyCoupon(code: string): Promise<Quote> {
  const { data } = await httpClient.post<Quote>('/cart/coupon', { code })
  return data
}

export async function removeCoupon(): Promise<Quote> {
  const { data } = await httpClient.delete<Quote>('/cart/coupon')
  return data
}

export async function mergeGuestCart(guestCartId: string): Promise<Quote> {
  const { data } = await httpClient.post<Quote>('/cart/merge', { guestCartId })
  return data
}