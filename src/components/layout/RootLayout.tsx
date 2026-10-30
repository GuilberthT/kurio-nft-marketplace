import { Outlet } from '@tanstack/react-router'
import { Header } from './Header'

export function RootLayout() {
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="mx-auto max-w-300 px-4 pb-20 lg:px-0">
        <Outlet />
      </main>
      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        © 2026 Kurio. Propriedade digital para todos.
      </footer>
    </>
  )
}