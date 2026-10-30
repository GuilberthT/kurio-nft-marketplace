export interface MockScenario {
  /** normal: ~300ms | lenta: +2.5s | variavel: alterna atrasos curtos e longos (respostas fora de ordem) */
  latency: 'normal' | 'lenta' | 'variavel'
  /** Falha forçada em todas as chamadas à API. */
  failure: 'nenhuma' | 'rede' | 'servidor'
  /** Resultado do pagamento depois que o pedido é criado. */
  payment: 'aprovar' | 'recusar'
  /** A carteira recusa a conexão. */
  walletRefuse: boolean
  /** A primeira criação de pedido grava o pedido mas a resposta "se perde" (timeout). */
  orderTimeoutOnce: boolean
   /** Favoritar/desfavoritar falha (testa a atualização otimista com rollback). */
  favoriteFails: boolean
}

export const DEFAULT_SCENARIO: MockScenario = {
  latency: 'normal',
  failure: 'nenhuma',
  payment: 'aprovar',
  walletRefuse: false,
  orderTimeoutOnce: false,
  favoriteFails: false,
}

export const SCENARIO_STORAGE_KEY = 'kurio:mock-scenario'

export function getScenario(): MockScenario {
  try {
    const saved = localStorage.getItem(SCENARIO_STORAGE_KEY)
    return saved ? { ...DEFAULT_SCENARIO, ...(JSON.parse(saved) as Partial<MockScenario>) } : DEFAULT_SCENARIO
  } catch {
    return DEFAULT_SCENARIO
  }
}

export function setScenario(patch: Partial<MockScenario>): MockScenario {
  const next = { ...getScenario(), ...patch }
  try {
    localStorage.setItem(SCENARIO_STORAGE_KEY, JSON.stringify(next))
  } catch {
    // sem persistência
  }
  return next
}

/** Atrasos fixos que se alternam: determinísticos, mas fazem respostas chegarem fora de ordem. */
const VARIABLE_DELAYS = [1800, 150, 900, 300, 2400, 100]
let variableIndex = 0

export function extraDelay(scenario: MockScenario): number {
  if (scenario.latency === 'lenta') return 2500
  if (scenario.latency === 'variavel') {
    const value = VARIABLE_DELAYS[variableIndex % VARIABLE_DELAYS.length]
    variableIndex += 1
    return value
  }
  return 0
}