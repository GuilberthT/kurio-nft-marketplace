import type { Wallet } from '@/types/wallet'

export const WALLET_FIXTURES: Record<string, Wallet[]> = {
  'user-ana': [
    { id: 'wallet-ana-1', kind: 'principal', provider: 'MetaMask', address: '0x7A42c1D9E0b3F8a6219E8', network: 'ethereum' },
    { id: 'wallet-ana-2', kind: 'secundaria', provider: 'Phantom', address: 'So1AnaKurio9f3B2kQ7', network: 'solana' },
  ],
  'user-bruno': [
    { id: 'wallet-bruno-1', kind: 'principal', provider: 'Coinbase', address: '0xB7c2E91aF04D3c55E82C', network: 'polygon' },
  ],
}