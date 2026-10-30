import type { EthAmount } from "./nft";
import type { QuoteLine } from "./cart";

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
}