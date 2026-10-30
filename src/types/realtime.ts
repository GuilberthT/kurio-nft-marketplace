import type { NftEdition, EthAmount } from './nft'
import type { OrderStatus } from './order'

/** Todo evento tem identidade estável (id), recurso afetado e versão. */
interface BaseEvent<TType extends string, TData> {
  id: string
  type: TType
  resourceId: string
  version: number
  data: TData
}

export type NftUpdatedEvent = BaseEvent<'nft.updated', { name: string; priceEth: EthAmount; editions: NftEdition[] }>

export type OrderUpdatedEvent = BaseEvent<'order.updated', { userId: string; status: OrderStatus }>

export type RealtimeEvent = NftUpdatedEvent | OrderUpdatedEvent