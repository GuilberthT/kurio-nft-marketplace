import type { Network } from './nft'

export const WALLET_PROVIDERS = ['MetaMask', 'WalletConnect', 'Coinbase', 'Phantom'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export interface Wallet {
  id: string
  kind: 'principal' | 'secundaria'
  provider: WalletProvider
  address: string
  network: Network
}