import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { io } from 'socket.io-client'
import { privateKey, useSession } from '@/auth/session'
import { getSessionToken } from '@/auth/sessionToken'
import { cartKey } from '@/cart/useCart'
import { orderKey } from '@/checkout/useCheckout'
import { nftKeys } from '@/queries/nfts'
import type { Nft } from '@/types/nft'
import type { Order } from '@/types/order'
import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/types/realtime'


const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.test'
const MAX_SEEN_EVENTS = 200

export type RealtimeStatus = 'connecting' | 'connected' | 'disconnected'

interface RealtimeValue {
  status: RealtimeStatus
  notice: string | null
}

const RealtimeContext = createContext<RealtimeValue>({ status: 'connecting', notice: null })

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { user, isLoading } = useSession()
  const userId = user?.id ?? null
  const [status, setStatus] = useState<RealtimeStatus>('connecting')
  const [notice, setNotice] = useState<string | null>(null)
  const noticeTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    if (isLoading) return

    // Um socket por sessão. Trocar de usuário fecha o anterior: eventos antigos não chegam ao novo.
    const socket = io(REALTIME_URL, { transports: ['websocket'], reconnectionDelayMax: 5000 })
    const seenEvents = new Set<string>()
    const lastVersion = new Map<string, number>()
    let connectedBefore = false

    /** Ignora duplicatas (mesmo id) e eventos antigos (versão menor ou igual à que já temos). */
    function shouldApply(event: { id: string; type: string; resourceId: string; version: number }) {
      if (seenEvents.has(event.id)) return false
      seenEvents.add(event.id)
      if (seenEvents.size > MAX_SEEN_EVENTS) seenEvents.delete(seenEvents.values().next().value!)
      const key = `${event.type}:${event.resourceId}`
      if (event.version <= (lastVersion.get(key) ?? 0)) return false
      lastVersion.set(key, event.version)
      return true
    }

    function announce(message: string) {
      setNotice(message)
      window.clearTimeout(noticeTimer.current)
      noticeTimer.current = window.setTimeout(() => setNotice(null), 6000)
    }

    /** Depois de (re)conectar, o REST é a fonte da verdade: busca de novo o que pode ter mudado. */
    function reconcile() {
      void queryClient.invalidateQueries({ queryKey: nftKeys.all })
      void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
      if (userId) void queryClient.invalidateQueries({ queryKey: [...privateKey(userId), 'order'] })
    }

    socket.on('connect', () => {
      setStatus('connected')
      const token = getSessionToken()
      if (userId && token) socket.emit('session', token)
      if (connectedBefore) reconcile()
      connectedBefore = true
    })
    socket.on('disconnect', () => setStatus('disconnected'))
    socket.io.on('reconnect_attempt', () => setStatus('connecting'))

    socket.on('nft.updated', (event: NftUpdatedEvent) => {
      if (!shouldApply(event)) return
      const cached = queryClient.getQueryData<Nft>(nftKeys.detail(event.resourceId))
      if (cached && cached.version >= event.version) return

      if (cached) {
        queryClient.setQueryData<Nft>(nftKeys.detail(event.resourceId), {
          ...cached,
          priceEth: event.data.priceEth,
          editions: event.data.editions,
          version: event.version,
        })
      }
      void queryClient.invalidateQueries({ queryKey: nftKeys.lists() })

      // Se o NFT está no carrinho, a cotação muda: recarrega e avisa o usuário.
      const cart = queryClient.getQueryData<{ lines: { nftId: string }[] }>(cartKey(userId))
      if (cart?.lines.some((line) => line.nftId === event.resourceId)) {
        void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
        announce(`${event.data.name} mudou de preço ou disponibilidade. O resumo do carrinho foi atualizado.`)
      }
    })

    socket.on('order.updated', (event: OrderUpdatedEvent) => {
      // Defesa extra: evento de pedido de outro usuário é descartado.
      if (!userId || event.data.userId !== userId || !shouldApply(event)) return
      const key = orderKey(userId, event.resourceId)
      const cached = queryClient.getQueryData<Order>(key)
      if (cached && cached.version >= event.version) return
      void queryClient.invalidateQueries({ queryKey: key })
      void queryClient.invalidateQueries({ queryKey: cartKey(userId) })
      announce(event.data.status === 'confirmed' ? 'Pagamento confirmado.' : 'Pagamento recusado.')
    })

    return () => {
      socket.removeAllListeners()
      socket.io.removeAllListeners()
      socket.disconnect()
    }
  }, [queryClient, userId, isLoading])

  return (
    <RealtimeContext.Provider value={{ status, notice }}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className={
          notice
            ? 'fixed right-4 bottom-4 z-50 max-w-sm rounded-md border border-primary bg-card px-4 py-3 text-sm shadow-lg'
            : 'sr-only'
        }
      >
        {notice}
      </div>
    </RealtimeContext.Provider>
  )
}

export function useRealtime(): RealtimeValue {
  return useContext(RealtimeContext)
}