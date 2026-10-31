import { realtimeHandlers } from '../realtime'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { networkHandlers } from './network'
import { nftHandlers } from './nfts'
import { orderHandlers } from './orders'
import { favoriteHandlers } from './favorites'
import { accountHandlers } from './account'

/** A ordem importa: o handler de rede (cenários) vem primeiro. */
export const handlers = [
  ...networkHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
  ...orderHandlers,
  ...nftHandlers,
  ...realtimeHandlers,
]