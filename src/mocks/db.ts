import type { Nft } from '@/types/nft'
import { NFT_FIXTURES } from './fixtures/nfts'

const STORAGE_KEY = 'kurio:mock-db:v1'

export interface MockDb {
  nfts: Nft[]
}

function createInitialDb(): MockDb {
  return { nfts: structuredClone(NFT_FIXTURES) }
}

function loadDb(): MockDb {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as MockDb
  } catch {
    // localStorage indisponível: segue com os dados iniciais
  }
  return createInitialDb()
}

export const db: MockDb = loadDb()

export function persistDb(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // sem persistência neste navegador
  }
}

export function resetDb(): void {
  Object.assign(db, createInitialDb())
  persistDb()
}