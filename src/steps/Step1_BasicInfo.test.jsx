import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FormProvider } from '../context/FormContext.jsx'
import { Step1_BasicInfo } from './Step1_BasicInfo.jsx'

const renderWithProvider = (ui) => render(<FormProvider>{ui}</FormProvider>)

describe('Step1_BasicInfo', () => {
  it('即時顯示年齡與 BMI', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15T00:00:00Z'))

    renderWithProvider(<Step1_BasicInfo />)

    fireEvent.click(screen.getByLabelText('女'))
    fireEvent.change(screen.getByLabelText('出生年月日'), { target: { value: '1990-06-20' } })
    fireEvent.change(screen.getByLabelText('身高 (cm)'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('體重 (kg)'), { target: { value: '65' } })
    const smokingGroup = screen.getByRole('radiogroup', { name: '抽煙' })
    fireEvent.click(within(smokingGroup).getByText('無'))
    const familyGroup = screen.getByRole('radiogroup', { name: '家族史' })
    fireEvent.click(within(familyGroup).getByText('無'))

    expect(screen.getByText('34 歲')).toBeInTheDocument()
    expect(screen.getByText('22.5')).toBeInTheDocument()
    expect(screen.getByText(/標準/)).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('表單驗證未通過時顯示錯誤訊息', () => {
    renderWithProvider(<Step1_BasicInfo />)

    fireEvent.click(screen.getByRole('button', { name: '下一步：慢性疾病狀態' }))

    expect(screen.getByText('請選擇性別')).toBeInTheDocument()
    expect(screen.getByText('請輸入出生年月日')).toBeInTheDocument()
    expect(screen.getByText('請輸入身高')).toBeInTheDocument()
    expect(screen.getByText('請輸入體重')).toBeInTheDocument()
    expect(screen.getByText('請選擇抽煙狀況')).toBeInTheDocument()
    expect(screen.getByText('請選擇家族史情況')).toBeInTheDocument()
  })
})
