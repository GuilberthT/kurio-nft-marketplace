import type { Network } from './nft'

export const WALLET_PROVIDERS = ['MetaMask', 'WalletConnect', 'Coinbase', 'Phantom'] as const
export type WalletProvider = (typeof WALLET_PROVIDERS)[number]

export const WALLET_KINDS = ['principal', 'secundaria'] as const
export type WalletKind = (typeof WALLET_KINDS)[number]

export interface Wallet {
  id: string
  kind: WalletKind
  provider: WalletProvider
  address: string
  network: Network
}

export type WalletInput = Pick<Wallet, 'kind' | 'provider' | 'network' | 'address'>