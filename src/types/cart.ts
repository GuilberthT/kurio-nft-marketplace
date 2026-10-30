import type { EditionType, EthAmount } from "./nft";

export interface CartItem {
    nftId: string
    edition: EditionType
    quantity: number
}

export interface Cart {
    items: CartItem[]
    couponCode?: string
}

export interface QuoteLine extends CartItem {
    nftName: string
    imageUrl: string
    unitPriceEth: EthAmount
    lineTotalEth: EthAmount
    nftVersion: number
    tokenId: string
    available: number
}

export interface Quote {
    id:string
    lines: QuoteLine[]
    couponCode?: string
    subtotalEth: EthAmount
    discountEth: EthAmount
    networkFeeEth: EthAmount
    totalEth: EthAmount
    expiresAt: string
}