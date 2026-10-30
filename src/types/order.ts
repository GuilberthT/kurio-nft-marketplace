import type { EthAmount, Network } from './nft'
import type { QuoteLine } from './cart'

export const ORDER_STATUSES = ['pending', 'confirmed', 'declined'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export interface Order {
  id: string
  idempotencyKey: string
  status: OrderStatus
  lines: QuoteLine[]
  subtotalEth: EthAmount
  discountEth: EthAmount
  networkFeeEth: EthAmount
  totalEth: EthAmount
  txHash?: string
  createdAt: string
  version: number
  walletProvider: string
  walletAddress: string
  network: Network
  declineReason?: string
}

export interface CreateOrderInput {
  expected: {
    totalEth: EthAmount
    lines: { nftId: string; edition: string; quantity: number; unitPriceEth: EthAmount }[]
  }
  walletId: string
  network: Network
  buyer: { displayName: string; email: string; note?: string }
}