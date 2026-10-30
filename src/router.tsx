import { createRootRoute, createRoute, createRouter } from '@tanstack/react-router'
import { RootLayout } from '@/components/layout/RootLayout'
import { validateCatalogSearch } from '@/lib/catalogSearch'
import { HomePage } from '@/pages/HomePage'
import { NftDetailPage } from '@/pages/NftDetailPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

const rootRoute = createRootRoute({
  component: RootLayout,
  notFoundComponent: NotFoundPage,
})

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  validateSearch: validateCatalogSearch,
  component: HomePage,
})

const nftDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/nft/$nftId',
  component: NftDetailPage,
})

const routeTree = rootRoute.addChildren([homeRoute, nftDetailRoute])

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}