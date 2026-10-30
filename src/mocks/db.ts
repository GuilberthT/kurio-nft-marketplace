import type { Cart } from '@/types/cart'
import type { Nft } from '@/types/nft'
import { NFT_FIXTURES } from './fixtures/nfts'
import { USER_FIXTURES, type UserRecord } from './fixtures/users'

const STORAGE_KEY = 'kurio:mock-db:v1'

export interface SessionRecord {
  token: string
  userId: string
  expiresAt: string
}

export interface MockDb {
  nfts: Nft[]
  users: UserRecord[]
  sessions: SessionRecord[]
    carts: Record<string, Cart>
}

function createInitialDb(): MockDb {
  return {
    nfts: structuredClone(NFT_FIXTURES),
    users: structuredClone(USER_FIXTURES),
    sessions: [],
    carts: {},
  }
}

function loadDb(): MockDb {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...createInitialDb(), ...(JSON.parse(saved) as Partial<MockDb>) }
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