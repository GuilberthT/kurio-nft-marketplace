import type { Wallet } from '@/types/wallet'

export const WALLET_FIXTURES: Record<string, Wallet[]> = {
  'user-ana': [
    { id: 'wallet-ana-1', kind: 'principal', provider: 'MetaMask', address: '0xa4c123b1612dd272d1371c17149d439536b3216f', network: 'ethereum' },
    { id: 'wallet-ana-2', kind: 'secundaria', provider: 'Phantom', address: 'TbQgdM9mwZgikp4WzxrxktcSSSS7XhS4D5EVB8Nf471d', network: 'solana' },
  ],
  'user-bruno': [
    { id: 'wallet-bruno-1', kind: 'principal', provider: 'Coinbase', address: '0xdaeeb975729fae923d5a4fd12aabfe228f219e9c', network: 'polygon' },
  ],
}