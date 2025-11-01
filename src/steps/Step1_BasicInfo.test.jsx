import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { FormProvider } from '../context/FormContext.jsx'
import { LanguageProvider } from '../context/LanguageContext.jsx'
import { Step1_BasicInfo } from './Step1_BasicInfo.jsx'

const renderWithProvider = (ui) =>
  render(
    <LanguageProvider>
      <FormProvider>{ui}</FormProvider>
    </LanguageProvider>,
  )

describe('Step1_BasicInfo', () => {
  it('收集基本資料且不顯示即時衍生資訊', () => {
    renderWithProvider(<Step1_BasicInfo />)

    fireEvent.click(screen.getByLabelText('女'))
    fireEvent.change(screen.getByLabelText('出生年月日'), { target: { value: '1990-06-20' } })
    fireEvent.change(screen.getByLabelText('身高 (cm)'), { target: { value: '170' } })
    fireEvent.change(screen.getByLabelText('體重 (kg)'), { target: { value: '65' } })
    fireEvent.change(screen.getByLabelText('腰圍 (cm)'), { target: { value: '85' } })

    const smokingGroup = screen.getByRole('radiogroup', { name: '目前是否抽菸' })
    fireEvent.click(within(smokingGroup).getByText('否'))

    const familyGroup = screen.getByRole('radiogroup', { name: '早發性冠心病家族史' })
    fireEvent.click(within(familyGroup).getByText('無'))

    expect(screen.getByLabelText('出生年月日')).toHaveValue('1990-06-20')
    expect(screen.getByLabelText('身高 (cm)')).toHaveValue(170)
    expect(screen.getByLabelText('體重 (kg)')).toHaveValue(65)
    expect(screen.getByLabelText('腰圍 (cm)')).toHaveValue(85)
    expect(screen.queryByText('目前年齡')).not.toBeInTheDocument()
    expect(screen.queryByText('BMI (kg/m²)')).not.toBeInTheDocument()
  })

  it('表單驗證失敗時顯示錯誤訊息', () => {
    renderWithProvider(<Step1_BasicInfo />)

    fireEvent.click(screen.getByRole('button', { name: '下一步：血壓與血脂' }))

    expect(screen.getByText('請選擇生理性別')).toBeInTheDocument()
    expect(screen.getByText('請輸入出生年月日')).toBeInTheDocument()
    expect(screen.getByText('請輸入身高')).toBeInTheDocument()
    expect(screen.getByText('請輸入體重')).toBeInTheDocument()
    expect(screen.getByText('請輸入腰圍')).toBeInTheDocument()
    expect(screen.getByText('請選擇是否抽菸')).toBeInTheDocument()
    expect(screen.getByText('請選擇家族史情況')).toBeInTheDocument()
  })
})
