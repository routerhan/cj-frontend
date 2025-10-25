import { evaluateRiskAssessment } from '../utils/riskRules.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isRiskAssessmentRequest = (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url ?? ''
  const method = (init?.method ?? (typeof input === 'object' && input?.method) ?? 'GET')
    .toString()
    .toUpperCase()
  return url.endsWith('/api/risk-assessment') && method === 'POST'
}

const parseJsonBody = async (requestInit = {}) => {
  if (!requestInit.body) return {}
  if (typeof requestInit.body === 'string') {
    try {
      return JSON.parse(requestInit.body)
    } catch (error) {
      console.warn('[mock-server] 無法解析 JSON：', error)
      return {}
    }
  }
  if (requestInit.body instanceof Blob) {
    const text = await requestInit.body.text()
    try {
      return JSON.parse(text)
    } catch {
      return {}
    }
  }
  return {}
}

export const registerMockServer = () => {
  if (typeof window === 'undefined') return
  if (window.__CJ_RISK_MOCK_SERVER__) return

  const originalFetch = window.fetch.bind(window)
  window.__CJ_RISK_MOCK_SERVER__ = true

  window.fetch = async (input, init = {}) => {
    if (!isRiskAssessmentRequest(input, init)) {
      return originalFetch(input, init)
    }

    const payload = await parseJsonBody(init)
    const result = evaluateRiskAssessment(payload)

    await delay(600 + Math.random() * 400)

    const headers = new Headers(init.headers ?? {})
    if (!headers.has('X-Mock-Source')) {
      headers.set('X-Mock-Source', 'risk-engine-mock')
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Mock-Source': headers.get('X-Mock-Source'),
      },
    })
  }
}
