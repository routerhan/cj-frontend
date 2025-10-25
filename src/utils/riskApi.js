import { buildRiskAssessmentPayload } from './riskMapper.js'

const API_ENDPOINT = '/api/risk-assessment'

export const requestRiskAssessment = async (formData) => {
  const payload = buildRiskAssessmentPayload(formData)

  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(error || '無法取得風險評估結果')
  }

  return response.json()
}
