import { StrictMode, type ComponentType } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

const mocksEnabled = import.meta.env.VITE_ENABLE_MOCKS !== 'false'

async function enableMocking(): Promise<ComponentType | null> {
  if (!mocksEnabled) return null
  const { worker } = await import('./mocks/browser')
  await worker.start({ onUnhandledRequest: 'bypass', quiet: import.meta.env.PROD })
  const { MockPanel } = await import('./mocks/MockPanel')
  return MockPanel
}

async function start() {
  // O MSW precisa ligar ANTES de o app (e o socket.io-client) ser carregado.
  const MockPanel = await enableMocking()
  const { default: App } = await import('./App')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
      {MockPanel && <MockPanel />}
    </StrictMode>,
  )
}

void start()