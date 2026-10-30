import { useState } from 'react'
import { getScenario, setScenario, type MockScenario } from './scenarios'

const DEMO_NFT = 'emerald-ape-042'

async function call(path: string, body?: unknown) {
  const response = await fetch(`/api/__mock/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  return response.ok
}

/**
 * Painel de cenários da simulação. Só existe quando os mocks estão ligados
 * e fica fora do app: não conhece React Query nem os componentes da loja.
 */
export function MockPanel() {
  const [open, setOpen] = useState(false)
  const [scenario, setLocal] = useState<MockScenario>(getScenario)
  const [message, setMessage] = useState('')

  function update(patch: Partial<MockScenario>) {
    setLocal(setScenario(patch))
  }

  async function action(label: string, path: string, body?: unknown) {
    const ok = await call(path, body)
    setMessage(ok ? `${label}: feito.` : `${label}: nada a fazer.`)
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 text-xs">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="rounded-md border border-border bg-card px-3 py-2 font-bold shadow-lg focus-visible:outline-2 focus-visible:outline-ring"
      >
        Cenários (mock)
      </button>

      {open && (
        <div className="mt-2 w-72 space-y-3 rounded-md border border-border bg-card p-4 shadow-xl">
          <label className="flex justify-between gap-2">
            Latência
            <select value={scenario.latency} onChange={(e) => update({ latency: e.target.value as MockScenario['latency'] })} className="bg-background">
              <option value="normal">normal</option>
              <option value="lenta">lenta (+2.5s)</option>
              <option value="variavel">variável (fora de ordem)</option>
            </select>
          </label>
          <label className="flex justify-between gap-2">
            Falha
            <select value={scenario.failure} onChange={(e) => update({ failure: e.target.value as MockScenario['failure'] })} className="bg-background">
              <option value="nenhuma">nenhuma</option>
              <option value="rede">sem conexão</option>
              <option value="servidor">erro 503</option>
            </select>
          </label>
          <label className="flex justify-between gap-2">
            Pagamento
            <select value={scenario.payment} onChange={(e) => update({ payment: e.target.value as MockScenario['payment'] })} className="bg-background">
              <option value="aprovar">aprovar</option>
              <option value="recusar">recusar</option>
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={scenario.walletRefuse} onChange={(e) => update({ walletRefuse: e.target.checked })} />
            Carteira recusa a conexão
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={scenario.orderTimeoutOnce} onChange={(e) => update({ orderTimeoutOnce: e.target.checked })} />
            Timeout após criar o próximo pedido
          </label>

          <div className="grid gap-1.5 border-t border-border pt-3">
            <button type="button" className="rounded border border-border px-2 py-1 text-left" onClick={() => void action('Preço alterado', 'nft-change', { nftId: DEMO_NFT, priceEth: '1.49' })}>
              Emerald Ape #042 passa a custar 1.49 ETH
            </button>
            <button type="button" className="rounded border border-border px-2 py-1 text-left" onClick={() => void action('Edição esgotada', 'nft-change', { nftId: DEMO_NFT, edition: '1/10', available: 0 })}>
              Esgotar a edição 1/10 do Emerald Ape
            </button>
            <button type="button" className="rounded border border-border px-2 py-1 text-left" onClick={() => void action('Evento reenviado', 'realtime/replay')}>
              Reenviar o último evento (duplicado)
            </button>
            <button type="button" className="rounded border border-border px-2 py-1 text-left" onClick={() => void action('Evento antigo enviado', 'realtime/stale')}>
              Enviar evento antigo de NFT
            </button>
            <button type="button" className="rounded border border-border px-2 py-1 text-left" onClick={() => void action('Conexão derrubada', 'realtime/disconnect')}>
              Derrubar a conexão em tempo real
            </button>
            <button type="button" className="rounded border border-border px-2 py-1 text-left" onClick={() => void action('Sessões expiradas', 'expire-sessions')}>
              Expirar a sessão (próxima ação pede login)
            </button>
            <button
              type="button"
              className="rounded border border-destructive/60 px-2 py-1 text-left"
              onClick={() => void call('reset').then(() => {
                localStorage.clear()
                sessionStorage.clear()
                window.location.reload()
              })}
            >
              Resetar todos os dados
            </button>
          </div>
          <p role="status" className="min-h-4 text-muted-foreground">
            {message}
          </p>
        </div>
      )}
    </div>
  )
}