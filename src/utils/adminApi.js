const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

const buildUrl = (path) => {
  if (!API_BASE) return path
  return `${API_BASE.replace(/\/$/, '')}${path}`
}

export const fetchAssessmentDashboard = async ({ limit = 50 } = {}) => {
  const endpoint = buildUrl(`/api/admin/assessments?limit=${encodeURIComponent(limit)}`)
  const response = await fetch(endpoint, {
    headers: { 'Content-Type': 'application/json' },
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || '無法載入評估紀錄')
  }

  return response.json()
}

