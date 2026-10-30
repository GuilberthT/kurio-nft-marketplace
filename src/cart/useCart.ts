import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addCartItem, applyCoupon, fetchCart, removeCartItem, removeCoupon, updateCartItem } from '@/api/cart'
import { privateKey, useSession } from '@/auth/session'
import type { Quote } from '@/types/cart'

export const guestCartKey = ['guest-cart'] as const

export function cartKey(userId: string | null) {
  return userId ? ([...privateKey(userId), 'cart'] as const) : guestCartKey
}

export function useCart() {
  const { user, isLoading } = useSession()
  return useQuery({
    queryKey: cartKey(user?.id ?? null),
    queryFn: ({ signal }) => fetchCart(signal),
    enabled: !isLoading,
  })
}

function useCartMutation<TInput>(mutationFn: (input: TInput) => Promise<Quote>) {
  const queryClient = useQueryClient()
  const { user } = useSession()
  return useMutation({
    mutationFn,
    onSuccess: (quote) => queryClient.setQueryData(cartKey(user?.id ?? null), quote),
  })
}

export const useAddToCart = () => useCartMutation(addCartItem)
export const useUpdateCartItem = () => useCartMutation(updateCartItem)
export const useRemoveCartItem = () => useCartMutation(removeCartItem)
export const useApplyCoupon = () => useCartMutation(applyCoupon)
export const useRemoveCoupon = () => useCartMutation(() => removeCoupon())

export function useCartCount(): number {
  const cart = useCart()
  return cart.data?.lines.reduce((total, line) => total + line.quantity, 0) ?? 0
}