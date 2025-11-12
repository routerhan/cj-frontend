import { useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import styles from './Step2_BpLipids.module.css'

const YES_NO_OPTIONS = [
  { value: 'yes', labelKey: 'yes' },
  { value: 'no', labelKey: 'no' },
]

const parsePositiveNumber = (value) => {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

const parseBloodPressure = (value) => parsePositiveNumber(value)

const parseLipidValue = (value) => parsePositiveNumber(value)

export const Step2_BpLipids = () => {
  const {
    formData,
    updateFormField,
    markCurrentStepCompleted,
    goToNext,
    setStepStatus,
    stepStatus,
    StepStatus,
    steps,
    getStepIndex,
  } = useFormContext()

  const { dictionary } = useLanguage()
  const copy = dictionary.bpAndLipids ?? dictionary.hypertensionDiabetes ?? {}
  const general = dictionary.general

  const bpAndLipids = formData.bpAndLipids
  const [errors, setErrors] = useState({})

  const markInProgress = () => {
    if (stepStatus.bpAndLipids === StepStatus.COMPLETED || stepStatus.hypertensionDiabetes === StepStatus.COMPLETED) {
      setStepStatus('bpAndLipids', StepStatus.IN_PROGRESS)
    }
  }

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleRadioChange = (field) => (event) => {
    updateFormField(['bpAndLipids', field], event.target.value)
    clearError(field)
    markInProgress()
  }

  const handleInputChange = (field) => (event) => {
    updateFormField(['bpAndLipids', field], event.target.value)
    clearError(field)
    markInProgress()
  }

  const validate = () => {
    const nextErrors = {}

    if (!bpAndLipids.usesHypertensionMedication) {
      nextErrors.usesHypertensionMedication = copy.errors?.usesHypertensionMedication ?? '請選擇是否使用高血壓藥物'
    }

    const hasSystolic = bpAndLipids.systolic !== ''
    const hasDiastolic = bpAndLipids.diastolic !== ''
    if (hasSystolic || hasDiastolic) {
      const systolic = parseBloodPressure(bpAndLipids.systolic)
      const diastolic = parseBloodPressure(bpAndLipids.diastolic)
      if (systolic === null || diastolic === null) {
        nextErrors.bloodPressure = copy.errors?.bloodPressure ?? '請輸入最近的血壓值'
      }
    }

    if (bpAndLipids.ldlMgDl !== '') {
      const ldl = parseLipidValue(bpAndLipids.ldlMgDl)
      if (ldl === null) {
        nextErrors.ldlMgDl = copy.errors?.ldlMgDl ?? '請輸入有效的 LDL 數值'
      }
    }

    if (bpAndLipids.hdlMgDl !== '') {
      const hdl = parseLipidValue(bpAndLipids.hdlMgDl)
      if (hdl === null) {
        nextErrors.hdlMgDl = copy.errors?.hdlMgDl ?? '請輸入有效的 HDL 數值'
      }
    }

    if (bpAndLipids.triglycerideMgDl !== '') {
      const tg = parseLipidValue(bpAndLipids.triglycerideMgDl)
      if (tg === null) {
        nextErrors.triglycerideMgDl =
          copy.errors?.triglycerideMgDl ?? '請輸入有效的三酸甘油酯數值'
      }
    }

    if (!bpAndLipids.usesTriglycerideMedication) {
      nextErrors.usesTriglycerideMedication = copy.errors?.usesTriglycerideMedication ?? '請選擇是否使用降三酸甘油酯藥物'
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

  const stepIndex = getStepIndex('bpAndLipids')
  const stepLabel = stepIndex >= 0 ? `Step ${stepIndex + 1}` : ''
  const nextStepKey = steps[stepIndex + 1]?.key
  const nextStepLabel = nextStepKey ? dictionary.steps[nextStepKey] ?? '' : ''
  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{dictionary.steps.bpAndLipids ?? '血壓與血脂'}</h2>
        </div>
        <p className={styles.lead}>
          {copy.lead ?? '請拿出最近的健檢或用藥資料，協助我們更精準評估心血管風險。'}
        </p>
      </header>

      <form
        className={styles.form}
        onSubmit={handleSubmit}
        noValidate
        data-testid="bp-lipids-form"
      >
        <div className={styles.section}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{copy.sections?.bloodPressure ?? '血壓與高血壓用藥'}</h3>
            </div>

            <div className={styles.fieldGroup}>
              <p className={styles.prompt}>
                {copy.prompts?.bloodPressure ?? '請拿出您最近的健檢報告。'}
              </p>
              <div>
                <span className={styles.labelRow}>{copy.fields?.usesHypertensionMedication ?? '目前是否使用降血壓藥物？'}</span>
                <div
                  role="radiogroup"
                  aria-label={copy.fields?.usesHypertensionMedication ?? '降血壓藥物'}
                  className={styles.optionGroup}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="usesHypertensionMedication"
                        value={option.value}
                        checked={bpAndLipids.usesHypertensionMedication === option.value}
                        onChange={handleRadioChange('usesHypertensionMedication')}
                        className={styles.radioInput}
                      />
                      <span>{general[option.labelKey] ?? option.labelKey}</span>
                    </label>
                  ))}
                </div>
                {errors.usesHypertensionMedication ? (
                  <p className={styles.error}>{errors.usesHypertensionMedication}</p>
                ) : null}
              </div>

              <div>
                <div className={styles.labelRow}>
                  <span>{copy.fields?.bloodPressure ?? '最近的血壓值'}</span>
                </div>
                <div className={styles.inlineInputs}>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="可留空"
                    value={bpAndLipids.systolic}
                    onChange={handleInputChange('systolic')}
                    aria-label="收縮壓"
                  />
                  <span>/</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="可留空"
                    value={bpAndLipids.diastolic}
                    onChange={handleInputChange('diastolic')}
                    aria-label="舒張壓"
                  />
                  <span>mmHg</span>
                </div>
                {errors.bloodPressure ? <p className={styles.error}>{errors.bloodPressure}</p> : null}
              </div>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>{copy.sections?.lipids ?? '血脂數值與治療'}</h3>
            </div>

            <div className={styles.fieldGroup}>
              <p className={styles.prompt}>
                {copy.prompts?.lipids ?? '請輸入您最近的空腹血脂數據。'}
              </p>
              <label className={styles.labelRow} htmlFor="ldlMgDl">
                {copy.fields?.ldlMgDl ?? '最近一次 低密度脂蛋白膽固醇 (LDL-C)'}
              </label>
              <div className={styles.inlineInputs}>
                <input
                  id="ldlMgDl"
                  type="number"
                  inputMode="decimal"
                  value={bpAndLipids.ldlMgDl}
                  onChange={handleInputChange('ldlMgDl')}
                  placeholder="可留空"
                />
                <span>mg/dL</span>
              </div>
              {errors.ldlMgDl ? <p className={styles.error}>{errors.ldlMgDl}</p> : null}
              <label className={styles.labelRow} htmlFor="hdlMgDl">
                {copy.fields?.hdlMgDl ?? '最近一次 高密度脂蛋白 (HDL-C)'}
              </label>
              <div className={styles.inlineInputs}>
                <input
                  id="hdlMgDl"
                  type="number"
                  inputMode="decimal"
                  value={bpAndLipids.hdlMgDl}
                  onChange={handleInputChange('hdlMgDl')}
                  placeholder="可留空"
                />
                <span>mg/dL</span>
              </div>
              {errors.hdlMgDl ? <p className={styles.error}>{errors.hdlMgDl}</p> : null}

              <label className={styles.labelRow} htmlFor="triglycerideMgDl">
                {copy.fields?.triglycerideMgDl ?? '最近一次三酸甘油酯'}
              </label>
              <div className={styles.inlineInputs}>
                <input
                  id="triglycerideMgDl"
                  type="number"
                  inputMode="decimal"
                  value={bpAndLipids.triglycerideMgDl}
                  onChange={handleInputChange('triglycerideMgDl')}
                  placeholder="可留空"
                />
                <span>mg/dL</span>
              </div>
              {errors.triglycerideMgDl ? <p className={styles.error}>{errors.triglycerideMgDl}</p> : null}

              <div>
                <span className={styles.labelRow}>{copy.fields?.usesTriglycerideMedication ?? '是否使用降 TG 藥物'}</span>
                <div
                  role="radiogroup"
                  aria-label={copy.fields?.usesTriglycerideMedication ?? '是否使用降 TG 藥物'}
                  className={styles.optionGroup}
                >
                  {YES_NO_OPTIONS.map((option) => (
                    <label key={option.value} className={styles.radioLabel}>
                      <input
                        type="radio"
                        name="usesTriglycerideMedication"
                        value={option.value}
                        checked={bpAndLipids.usesTriglycerideMedication === option.value}
                        onChange={handleRadioChange('usesTriglycerideMedication')}
                        className={styles.radioInput}
                      />
                      <span>{general[option.labelKey] ?? option.labelKey}</span>
                    </label>
                  ))}
                </div>
                {errors.usesTriglycerideMedication ? (
                  <p className={styles.error}>{errors.usesTriglycerideMedication}</p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="submit">
            {copy.buttonNext ?? `下一步：${nextStepLabel}`}
          </Button>
        </div>
      </form>
    </section>
  )
}
