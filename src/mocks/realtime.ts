import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { NftUpdatedEvent, OrderUpdatedEvent, RealtimeEvent } from '@/types/realtime'
import { db } from './db'
import { onNftChange } from './events'
import { onOrderChange } from './orders'

export const MOCK_REALTIME_URL = 'wss://realtime.kurio.test'

interface ClientConnection {
  io: ReturnType<typeof toSocketIo>
  close: () => void
  userId: string | null
}

const clients = new Set<ClientConnection>()
let lastEvent: RealtimeEvent | null = null

function send(event: RealtimeEvent, onlyUserId?: string) {
  lastEvent = event
  for (const client of clients) {
    if (onlyUserId && client.userId !== onlyUserId) continue
    client.io.client.emit(event.type, event)
  }
}

onNftChange((nft) => {
  const event: NftUpdatedEvent = {
    id: crypto.randomUUID(),
    type: 'nft.updated',
    resourceId: nft.id,
    version: nft.version,
    data: { name: nft.name, priceEth: nft.priceEth, editions: nft.editions },
  }
  send(event)
})

onOrderChange((order) => {
  const event: OrderUpdatedEvent = {
    id: crypto.randomUUID(),
    type: 'order.updated',
    resourceId: order.id,
    version: order.version,
    data: { userId: order.userId, status: order.status },
  }
  // Pedido é privado: só a conexão do dono recebe.
  send(event, order.userId)
})

/** Reenvia o último evento (testa duplicata). */
export function replayLastEvent(): boolean {
  if (!lastEvent) return false
  send(lastEvent, lastEvent.type === 'order.updated' ? lastEvent.data.userId : undefined)
  return true
}

/** Envia uma cópia do último evento de NFT com versão antiga (testa evento fora de ordem). */
export function sendStaleNftEvent(): boolean {
  if (lastEvent?.type !== 'nft.updated') return false
  const stale: NftUpdatedEvent = {
    ...lastEvent,
    id: crypto.randomUUID(),
    version: lastEvent.version - 1,
    data: { ...lastEvent.data, priceEth: '0.01' },
  }
  send(stale)
  return true
}

/** Derruba todas as conexões. O socket.io-client reconecta sozinho. */
export function dropAllConnections(): void {
  for (const client of clients) client.close()
}

const realtime = ws.link(`${MOCK_REALTIME_URL}/*`)

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const io = toSocketIo(connection)
    const client: ClientConnection = { io, close: () => connection.client.close(), userId: null }
    clients.add(client)

    // O cliente se identifica com o token da sessão; sem token, recebe só eventos públicos.
    io.client.on('session', (_event, token: unknown) => {
      const session = db.sessions.find((item) => item.token === token && new Date(item.expiresAt).getTime() > Date.now())
      client.userId = session?.userId ?? null
    })

    // O servidor do Socket.IO manda "ping" (2) periodicamente; sem isso o cliente cai por timeout.
    const heartbeat = setInterval(() => connection.client.send('2'), 20_000)
    connection.client.addEventListener('close', () => {
      clearInterval(heartbeat)
      clients.delete(client)
    })
  }),
]