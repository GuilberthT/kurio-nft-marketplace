import { realtimeHandlers } from '../realtime'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { networkHandlers } from './network'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { favoriteHandlers } from './favorites'

/** A ordem importa: o handler de rede (cenários) vem primeiro. */
export const handlers = [
  ...networkHandlers,
  ...authHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
  ...orderHandlers,
  ...nftHandlers,
  ...realtimeHandlers,
]