import { delay, http, HttpResponse } from 'msw'
import { resetDb } from '../db'
import { apiError } from '../http'
import { DEFAULT_SCENARIO, extraDelay, getScenario, setScenario } from '../scenarios'

/**
 * Este handler roda ANTES de todos os outros. Ele aplica o cenário (atraso e falhas)
 * e, quando não devolve nada, a requisição segue para o handler de verdade.
 */
export const networkHandlers = [
  http.post('/api/__mock/reset', () => {
    resetDb()
    setScenario(DEFAULT_SCENARIO)
    return new HttpResponse(null, { status: 204 })
  }),

  http.all('/api/*', async () => {
    const scenario = getScenario()
    const extra = extraDelay(scenario)
    if (extra > 0) await delay(extra)
    if (scenario.failure === 'rede') return HttpResponse.error()
    if (scenario.failure === 'servidor') {
      return apiError(503, 'UNAVAILABLE', 'Serviço temporariamente indisponível. Tente novamente em instantes.')
    }
    return undefined
  }),
]