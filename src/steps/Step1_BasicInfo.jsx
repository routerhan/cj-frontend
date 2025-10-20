import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { Tooltip } from '../components/ui/Tooltip.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { calculateAge, calculateBMI, getBMICategory } from '../utils/calculations.js'
import styles from './Step1_BasicInfo.module.css'

const BMI_SUGGESTIONS = {
  過輕: '建議增加均衡飲食與阻力訓練，避免營養不足。',
  標準: '維持當前生活習慣，定期追蹤體重與身體組成。',
  過重: '適度調整飲食並增加運動量，有助降低代謝風險。',
  肥胖: '建議諮詢營養師或醫師，制定個人化體重管理計畫。',
}

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]

const SMOKING_OPTIONS = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '無' },
  { value: 'quit', label: '已戒' },
]

const FAMILY_HISTORY_OPTIONS = [
  { value: 'yes', label: '有' },
  { value: 'no', label: '無' },
  { value: 'unknown', label: '不知道' },
]

export const Step1_BasicInfo = () => {
  const {
    formData,
    updateFormField,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    stepStatus,
    StepStatus,
  } = useFormContext()

  const { basicInfo } = formData
  const [errors, setErrors] = useState({})

  const age = useMemo(() => calculateAge(basicInfo.birthDate), [basicInfo.birthDate])
  const bmi = useMemo(
    () => calculateBMI(basicInfo.heightCm, basicInfo.weightKg),
    [basicInfo.heightCm, basicInfo.weightKg],
  )
  const bmiCategory = useMemo(() => getBMICategory(bmi), [bmi])

  useEffect(() => {
    const normalizedAge = Number.isFinite(age) ? age : null
    if ((basicInfo.ageYears ?? null) !== (normalizedAge ?? null)) {
      updateFormField(['basicInfo', 'ageYears'], normalizedAge)
    }
  }, [age, basicInfo.ageYears, updateFormField])

  useEffect(() => {
    const normalizedBMI = Number.isFinite(bmi) ? bmi : null
    if ((basicInfo.bmi ?? null) !== (normalizedBMI ?? null)) {
      updateFormField(['basicInfo', 'bmi'], normalizedBMI)
    }
  }, [bmi, basicInfo.bmi, updateFormField])

  useEffect(() => {
    if ((basicInfo.bmiCategory ?? '') !== (bmiCategory ?? '')) {
      updateFormField(['basicInfo', 'bmiCategory'], bmiCategory)
    }
  }, [bmiCategory, basicInfo.bmiCategory, updateFormField])

  const markStepInProgressIfNeeded = () => {
    if (stepStatus.basicInfo === StepStatus.COMPLETED) {
      setStepStatus('basicInfo', StepStatus.IN_PROGRESS)
    }
  }

  const handleFieldChange = (field) => (event) => {
    const { value } = event.target
    updateFormField(['basicInfo', field], value)
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
    markStepInProgressIfNeeded()
  }

  const handleGenderChange = (event) => {
    const { value } = event.target
    updateFormField(['basicInfo', 'gender'], value)
    if (value !== 'other' && basicInfo.genderOther) {
      updateFormField(['basicInfo', 'genderOther'], '')
    }
    setErrors((prev) => {
      const next = { ...prev }
      delete next.gender
      delete next.genderOther
      return next
    })
    markStepInProgressIfNeeded()
  }

  const validate = () => {
    const nextErrors = {}

    if (!basicInfo.gender) {
      nextErrors.gender = '請選擇性別'
    } else if (basicInfo.gender === 'other' && !basicInfo.genderOther) {
      nextErrors.genderOther = '請填寫自訂性別'
    }

    if (!basicInfo.birthDate) {
      nextErrors.birthDate = '請輸入出生年月日'
    } else if (age === null) {
      nextErrors.birthDate = '請確認日期格式或是否為未來日期'
    }

    const hasHeightValue = basicInfo.heightCm !== ''
    const hasWeightValue = basicInfo.weightKg !== ''

    if (!hasHeightValue) {
      nextErrors.heightCm = '請輸入身高'
    }
    if (!hasWeightValue) {
      nextErrors.weightKg = '請輸入體重'
    }
    if (hasHeightValue && hasWeightValue && bmi === null) {
      nextErrors.weightKg = '請確認身高與體重數值是否正確'
    }

    if (!basicInfo.smokingStatus) {
      nextErrors.smokingStatus = '請選擇抽煙狀況'
    }

    if (!basicInfo.familyHistory) {
      nextErrors.familyHistory = '請選擇家族史情況'
    }

    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length === 0) {
      markCurrentStepCompleted()
      goToNext()
    }
  }

  const ageDisplay = Number.isFinite(age) ? `${age} 歲` : '--'
  const bmiDisplay = Number.isFinite(bmi) ? bmi.toFixed(1) : '--'
  const bmiDescription = (() => {
    if (!basicInfo.heightCm || !basicInfo.weightKg) return '請輸入身高與體重以計算 BMI'
    if (!Number.isFinite(bmi)) return '請確認身高與體重數值是否正確'
    const suggestion = BMI_SUGGESTIONS[bmiCategory] ?? '請持續關注身體變化並定期檢測'
    return `${bmiCategory} · ${suggestion}`
  })()

  const ageDescription = (() => {
    if (!basicInfo.birthDate) return '請輸入出生年月日以建立基礎資料'
    if (!Number.isFinite(age)) return '請確認日期格式是否正確，或是否為未來日期'
    return '系統會根據生日自動更新您的年齡'
  })()

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Step 1</p>
          <h2>基本資料與生活習慣</h2>
        </div>
        <p className={styles.lead}>
          請提供您的基本身體與生活習慣資料，我們將即時計算年齡與 BMI，作為風險評估的基礎。
        </p>
      </header>

      <div className={styles.body}>
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>個人資料</h3>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <span className={styles.label}>性別</span>
                <div className={styles.optionGroup} role="radiogroup" aria-label="性別">
                  {GENDER_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="gender"
                        value={option.value}
                        checked={basicInfo.gender === option.value}
                        onChange={handleGenderChange}
                        className={styles.radioInput}
                        aria-invalid={Boolean(errors.gender)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {basicInfo.gender === 'other' ? (
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="請填寫您的認同性別"
                    value={basicInfo.genderOther}
                    onChange={handleFieldChange('genderOther')}
                    aria-invalid={Boolean(errors.genderOther)}
                  />
                ) : null}
                {errors.gender ? <p className={styles.error}>{errors.gender}</p> : null}
                {errors.genderOther ? <p className={styles.error}>{errors.genderOther}</p> : null}
              </div>

              <label className={styles.field} htmlFor="birthDate">
                <span className={styles.label}>出生年月日</span>
                <input
                  id="birthDate"
                  type="date"
                  value={basicInfo.birthDate}
                  onChange={handleFieldChange('birthDate')}
                  className={styles.input}
                  aria-invalid={Boolean(errors.birthDate)}
                />
                {errors.birthDate ? <p className={styles.error}>{errors.birthDate}</p> : null}
              </label>

              <label className={styles.field} htmlFor="nationality">
                <span className={styles.label}>國籍</span>
                <input
                  id="nationality"
                  type="text"
                  placeholder="例如：臺灣"
                  value={basicInfo.nationality}
                  onChange={handleFieldChange('nationality')}
                  className={styles.input}
                />
              </label>
            </div>
          </section>

          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>身體測量</h3>
            <div className={styles.fieldGrid}>
              <label className={styles.field} htmlFor="heightCm">
                <span className={styles.label}>身高 (cm)</span>
                <input
                  id="heightCm"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="例如：170"
                  value={basicInfo.heightCm}
                  onChange={handleFieldChange('heightCm')}
                  className={styles.input}
                  aria-invalid={Boolean(errors.heightCm)}
                />
                {errors.heightCm ? <p className={styles.error}>{errors.heightCm}</p> : null}
              </label>

              <label className={styles.field} htmlFor="weightKg">
                <span className={styles.label}>體重 (kg)</span>
                <input
                  id="weightKg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="例如：65"
                  value={basicInfo.weightKg}
                  onChange={handleFieldChange('weightKg')}
                  className={styles.input}
                  aria-invalid={Boolean(errors.weightKg)}
                />
                {errors.weightKg ? <p className={styles.error}>{errors.weightKg}</p> : null}
              </label>

              <label className={styles.field} htmlFor="waistCm">
                <span className={styles.label}>腰圍 (cm)</span>
                <input
                  id="waistCm"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  placeholder="例如：80"
                  value={basicInfo.waistCm}
                  onChange={handleFieldChange('waistCm')}
                  className={styles.input}
                />
              </label>
            </div>
          </section>

          <section className={styles.fieldset}>
            <h3 className={styles.sectionTitle}>生活習慣與家族史</h3>
            <div className={styles.fieldGrid}>
              <div className={styles.field}>
                <span className={styles.label}>抽煙</span>
                <div className={styles.optionGroup} role="radiogroup" aria-label="抽煙">
                  {SMOKING_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="smokingStatus"
                        value={option.value}
                        checked={basicInfo.smokingStatus === option.value}
                        onChange={handleFieldChange('smokingStatus')}
                        className={styles.radioInput}
                        aria-invalid={Boolean(errors.smokingStatus)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.smokingStatus ? (
                  <p className={styles.error}>{errors.smokingStatus}</p>
                ) : null}
              </div>

              <div className={styles.field}>
                <span className={styles.labelWithTooltip}>
                  家族史
                  <Tooltip
                    label="父親 55 歲前或母親 65 歲前發生心肌梗塞或冠心病皆視為陽性家族史。"
                    triggerLabel="家族史說明"
                  />
                </span>
                <div className={styles.optionGroup} role="radiogroup" aria-label="家族史">
                  {FAMILY_HISTORY_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="familyHistory"
                        value={option.value}
                        checked={basicInfo.familyHistory === option.value}
                        onChange={handleFieldChange('familyHistory')}
                        className={styles.radioInput}
                        aria-invalid={Boolean(errors.familyHistory)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                {errors.familyHistory ? (
                  <p className={styles.error}>{errors.familyHistory}</p>
                ) : null}
              </div>
            </div>
          </section>

          <div className={styles.actions}>
            <Button type="submit">下一步：慢性疾病狀態</Button>
          </div>
        </form>

        <aside className={styles.results}>
          <InstantResult label="年齡" value={ageDisplay} description={ageDescription} />
          <InstantResult label="BMI (kg/m²)" value={bmiDisplay} description={bmiDescription} />
        </aside>
      </div>
    </section>
  )
}
