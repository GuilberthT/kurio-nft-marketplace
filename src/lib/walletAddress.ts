import type { Network } from '@/types/nft'

const EVM_ADDRESS = /^0x[a-fA-F0-9]{40}$/
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

/** Ethereum e Polygon usam endereços 0x de 40 caracteres hexadecimais; Solana usa base58. */
export function validateWalletAddress(network: Network, address: string): string | undefined {
  const value = address.trim()
  if (!value) return 'Informe o endereço da carteira.'
  if (network === 'solana') {
    return SOLANA_ADDRESS.test(value) ? undefined : 'Endereço Solana inválido (base58, 32 a 44 caracteres).'
  }
  return EVM_ADDRESS.test(value) ? undefined : 'Endereço inválido: use 0x seguido de 40 caracteres hexadecimais.'
}