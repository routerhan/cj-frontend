import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AssessmentDashboard } from './AssessmentDashboard.jsx'

const sampleResponse = {
  stats: {
    totalAssessments: 2,
    byLevel: {
      extremely_high: 1,
      very_high: 0,
      high: 1,
      medium: 0,
      low: 0,
      undefined: 0,
    },
    averageRiskFactorCount: 3.5,
    latestAssessmentAt: '2025-10-26T12:30:00.000Z',
  },
  assessments: [
    {
      id: 1,
      createdAt: '2025-10-26T12:30:00.000Z',
      level: '極高',
      levelCode: 'extremely_high',
      riskFactorCount: 5,
      matchedRules: [{ code: 'cad_recent_mi', label: '冠狀動脈疾病且過去一年曾發生心肌梗塞' }],
      recommendations: ['保持追蹤'],
      riskFactors: [
        { code: 'hypertension', label: '高血壓', present: true },
        { code: 'smoking', label: '抽菸', present: false },
      ],
      metabolicSyndrome: {
        count: 4,
        components: {
          abdominalObesity: true,
          elevatedBloodPressure: true,
          elevatedGlucose: true,
          elevatedTriglyceride: false,
          lowHdl: true,
        },
      },
      payload: { age: 65, is_male: true },
    },
  ],
}

describe('AssessmentDashboard', () => {
  beforeEach(() => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => sampleResponse,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders stats and assessment table', async () => {
    render(<AssessmentDashboard />)

    expect(await screen.findByText('心血管評估資料概覽')).toBeInTheDocument()
    expect(screen.getByText('總評估次數')).toBeInTheDocument()
    const levelChips = await screen.findAllByText('極高')
    expect(levelChips.length).toBeGreaterThan(0)
    expect(screen.getByText('5 項')).toBeInTheDocument()
    expect(screen.getByText('冠狀動脈疾病且過去一年曾發生心肌梗塞')).toBeInTheDocument()
  })
})
