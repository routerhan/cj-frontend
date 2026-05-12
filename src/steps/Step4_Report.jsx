import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { useLanguage } from '../context/LanguageContext.jsx'
import { MEDICAL_HISTORY_GROUPS } from '../config/medicalHistorySchema.js'
import { requestRiskAssessment } from '../utils/riskApi.js'
import styles from './Step4_Report.module.css'

const COUNT_ONLY_RULE_CODES = new Set(['risk_factor_count', 'single_risk_factor'])

const hasData = (value) => value !== null && value !== undefined && value !== ''

const getNested = (object, path) =>
  path.reduce((accumulator, key) => (accumulator && accumulator[key] !== undefined ? accumulator[key] : undefined), object)

const ensureGroupState = (groupConfig, rawGroup) => {
  const state = {}
  groupConfig.options.forEach(({ key }) => {
    state[key] = Boolean(rawGroup?.[key])
  })
  return state
}

export const Step4_Report = () => {
  const {
    formData,
    updateFormSection,
    markCurrentStepCompleted,
    resetForm,
    StepStatus,
    stepStatus,
    setStepStatus,
    steps,
    derivedMetrics,
  } = useFormContext()

  const { dictionary } = useLanguage()
  const reportCopy = dictionary.report ?? {}
  const medicalCopy = dictionary.medicalHistoryStep ?? dictionary.cardioHistoryStep ?? {}
  const fmt = reportCopy.formatters ?? {}

  // Formatters using translations
  const formatBooleanChoice = (value) => {
    if (value === true || value === 'yes') return fmt.yes ?? 'Yes'
    if (value === false || value === 'no') return fmt.no ?? 'No'
    if (value === 'unknown') return fmt.unknown ?? 'Unknown'
    return fmt.notFilled ?? 'Not filled'
  }

  const formatSex = (value) => {
    if (value === 'male') return fmt.male ?? 'Male'
    if (value === 'female') return fmt.female ?? 'Female'
    if (value === 'other') return fmt.other ?? 'Other'
    return fmt.notFilled ?? 'Not filled'
  }

  const formatNumberWithUnit = (value, unit) => {
    if (!hasData(value)) return fmt.notFilled ?? 'Not filled'
    return unit ? `${value} ${unit}` : String(value)
  }

  const formatBloodPressure = (systolic, diastolic) => {
    const hasSystolic = hasData(systolic)
    const hasDiastolic = hasData(diastolic)
    if (hasSystolic && hasDiastolic) return `${systolic} / ${diastolic} mmHg`
    if (hasSystolic) return `${systolic} mmHg`
    if (hasDiastolic) return `${diastolic} mmHg`
    return fmt.notFilled ?? 'Not filled'
  }

  const formatDerived = (value, suffix) => {
    if (value === null || value === undefined || Number.isNaN(value)) return reportCopy.labels?.notCalculated ?? 'Not calculated'
    return suffix ? `${value}${suffix}` : String(value)
  }

  const formatWaistStatus = (waist) => {
    if (!waist || waist.threshold === null) return reportCopy.labels?.notCalculated ?? 'Not calculated'
    const thresholdText = (fmt.threshold ?? ' (threshold {value})').replace('{value}', `${waist.threshold} cm`)
    return `${waist.isObese ? (fmt.yes ?? 'Yes') : (fmt.no ?? 'No')}${thresholdText}`
  }

  const formatHdlStatus = (threshold, isLow) => {
    if (threshold === null || threshold === undefined) return reportCopy.labels?.notCalculated ?? 'Not calculated'
    const thresholdText = (fmt.threshold ?? ' (threshold {value})').replace('{value}', `${threshold} mg/dL`)
    return `${isLow ? (fmt.yes ?? 'Yes') : (fmt.no ?? 'No')}${thresholdText}`
  }

  const report = formData.report ?? {}
  const hasRequestedRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const ensureStepInProgress = () => {
    if (stepStatus.report === StepStatus.COMPLETED) {
      setStepStatus('report', StepStatus.IN_PROGRESS)
    }
  }

  const runCalculation = async (force = false) => {
    if (loading) return
    if (!force && hasRequestedRef.current) return
    hasRequestedRef.current = true

    try {
      ensureStepInProgress()
      setLoading(true)
      setError(null)
      const result = await requestRiskAssessment(formData)
      updateFormSection('report', result)
      markCurrentStepCompleted()
      setStepStatus('report', StepStatus.COMPLETED)
    } catch (err) {
      hasRequestedRef.current = false
      setError(err.message || (reportCopy.error ?? 'Something went wrong. Please try again later.'))
    } finally {
      setLoading(false)
    }
  }

  const handleExitReport = () => {
    hasRequestedRef.current = false
    resetForm()
  }

  useEffect(() => {
    if (!report?.level && !loading && !hasRequestedRef.current) {
      runCalculation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelDescriptions = reportCopy.levelDescription ?? {}
  const ldlTargets = reportCopy.ldlTargets ?? {}
  const metabolicLabels = reportCopy.metabolicComponents ?? {}
  const sectionTitles = reportCopy.sections ?? {}
  const labels = reportCopy.labels ?? {}
  const dataLabels = reportCopy.dataLabels ?? {}
  const dataSections = reportCopy.dataSections ?? {}

  // Translation mappings to override backend Chinese labels
  const levelLabels = reportCopy.levelLabels ?? {}
  const riskFactorLabelsMap = reportCopy.riskFactorLabels ?? {}
  const ruleLabelsMap = reportCopy.ruleLabels ?? {}
  const recommendationsMap = reportCopy.recommendations ?? {}

  // Translate level from levelCode
  const translatedLevel = levelLabels[report.levelCode] ?? report.level ?? ''

  // Translate risk factors using code
  const riskFactorItems = (report.riskFactors ?? []).map((item) => ({
    ...item,
    label: riskFactorLabelsMap[item.code] ?? item.label,
  }))

  // Translate matched rules using code
  const matchedRules = (report.matchedRules ?? []).map((rule) => ({
    ...rule,
    label: ruleLabelsMap[rule.code] ?? rule.label,
  }))

  // Translate recommendations by levelCode
  const translatedRecommendations = recommendationsMap[report.levelCode] ?? report.recommendations ?? []

  const levelDescription = levelDescriptions[report.levelCode] ?? levelDescriptions.undefined ?? ''
  const ldlTarget = ldlTargets[report.levelCode] ?? ldlTargets.undefined ?? ''
  const showLdlTarget =
    report.levelCode && report.levelCode !== 'undefined' && report.levelCode !== 'no_risk'

  const metabolicInfo = report.metabolicSyndrome ?? { count: 0, components: {} }

  const judgement = useMemo(() => {
    if (!report.levelCode || report.levelCode === 'undefined') {
      return {
        message: labels.incompleteData ?? 'Insufficient data: please complete age, gender, blood pressure, and lipid measurements.',
        items: [],
      }
    }
    if (report.levelCode === 'no_risk') {
      return {
        message: labels.noRiskCondition ?? 'No matching cardiovascular risk conditions detected.',
        items: [],
      }
    }
    const triggeredRiskFactors = riskFactorItems.filter((item) => item.present).map((item) => item.label)
    const meaningfulRules = matchedRules.filter((rule) => !COUNT_ONLY_RULE_CODES.has(rule.code))

    if (meaningfulRules.length > 0) {
      const ruleLabels = meaningfulRules.map((rule) => rule.label)
      const base = (labels.classifiedAs ?? 'You are classified as {level} risk because you meet the following conditions').replace('{level}', translatedLevel)
      return {
        message: ruleLabels.length > 0 ? `${base}:` : `${base}.`,
        items: ruleLabels,
      }
    }

    if (triggeredRiskFactors.length > 0) {
      const base = (labels.riskFactorCount ?? 'You have {count} cardiovascular risk factor(s)').replace('{count}', triggeredRiskFactors.length)
      return {
        message: `${base}:`,
        items: triggeredRiskFactors,
      }
    }

    return {
      message: (labels.maintainHealthy ?? 'You are classified as {level} risk. Continue maintaining a healthy lifestyle.').replace('{level}', translatedLevel),
      items: [],
    }
  }, [labels, matchedRules, report.levelCode, riskFactorItems, translatedLevel])

  const metabolicComponents = useMemo(() => {
    const components = metabolicInfo.components ?? {}
    const componentKeys = ['abdominalObesity', 'elevatedBloodPressure', 'elevatedGlucose', 'elevatedTriglyceride', 'lowHdl']
    return componentKeys.map((key) => ({
      key,
      label: metabolicLabels[key] ?? key,
      present: Boolean(components[key]),
    }))
  }, [metabolicInfo.components, metabolicLabels])

  const dataOverviewSections = useMemo(() => {
    const basic = formData.basic ?? {}
    const bpAndLipids = formData.bpAndLipids ?? {}
    const diabetes = formData.diabetes ?? {}
    const kidney = formData.kidney ?? {}
    const history = formData.history ?? {}

    const historyItems = MEDICAL_HISTORY_GROUPS.flatMap((group) => {
      const prompt = getNested(medicalCopy, group.promptPath) ?? group.fallbackPrompt ?? ''
      const groupState = ensureGroupState(group, history[group.groupKey])
      const noneOption = group.options.find((option) => option.isNone)
      const selectedNonNone = group.options.filter((option) => groupState[option.key] && !option.isNone)

      let value = fmt.notFilled ?? 'Not filled'
      if (selectedNonNone.length > 0) {
        const optLabels = selectedNonNone.map((option) =>
          getNested(medicalCopy, option.labelPath) ?? option.fallbackLabel ?? option.key,
        )
        value = `${fmt.checked ?? 'Checked: '}${optLabels.join(', ')}`
      } else if (noneOption && groupState[noneOption.key]) {
        const noneLabel =
          getNested(medicalCopy, noneOption.labelPath) ?? noneOption.fallbackLabel ?? noneOption.key
        value = `${fmt.checked ?? 'Checked: '}${noneLabel}`
      } else if (group.options.some((option) => groupState[option.key])) {
        const optLabels = group.options
          .filter((option) => groupState[option.key])
          .map((option) => getNested(medicalCopy, option.labelPath) ?? option.fallbackLabel ?? option.key)
        value = `${fmt.checked ?? 'Checked: '}${optLabels.join(', ')}`
      }

      return [{ label: prompt, value }]
    })

    return [
      {
        key: 'basic',
        title: dataSections.basic ?? 'Basic Information',
        items: [
          { label: dataLabels.sex ?? 'Biological sex', value: formatSex(basic.sex) },
          { label: dataLabels.birthDate ?? 'Date of birth', value: hasData(basic.birthDate) ? basic.birthDate : (fmt.notFilled ?? 'Not filled') },
          { label: dataLabels.age ?? 'Age', value: formatDerived(derivedMetrics.ageYears, fmt.yearsOld ?? ' years') },
          { label: dataLabels.height ?? 'Height', value: formatNumberWithUnit(basic.heightCm, 'cm') },
          { label: dataLabels.weight ?? 'Weight', value: formatNumberWithUnit(basic.weightKg, 'kg') },
          { label: dataLabels.bmi ?? 'BMI', value: formatDerived(derivedMetrics.bmi) },
          { label: dataLabels.waist ?? 'Waist', value: formatNumberWithUnit(basic.waistCm, 'cm') },
          { label: dataLabels.waistStatus ?? 'Abdominal obesity status', value: formatWaistStatus(derivedMetrics.waist) },
          { label: dataLabels.smoking ?? 'Current smoker', value: formatBooleanChoice(basic.currentSmoker) },
          { label: dataLabels.familyHistory ?? 'Family history of premature CHD', value: formatBooleanChoice(basic.familyHistoryEarlyChd) },
        ],
      },
      {
        key: 'bpAndLipids',
        title: dataSections.bpAndLipids ?? 'Blood Pressure & Lipids',
        items: [
          { label: dataLabels.hypertensionMed ?? 'Using antihypertensive medication', value: formatBooleanChoice(bpAndLipids.usesHypertensionMedication) },
          { label: dataLabels.recentBP ?? 'Recent blood pressure', value: formatBloodPressure(bpAndLipids.systolic, bpAndLipids.diastolic) },
          { label: dataLabels.ldl ?? 'LDL-C', value: formatNumberWithUnit(bpAndLipids.ldlMgDl, 'mg/dL') },
          { label: dataLabels.hdl ?? 'HDL-C', value: formatNumberWithUnit(bpAndLipids.hdlMgDl, 'mg/dL') },
          {
            label: dataLabels.hdlLow ?? 'HDL-C below threshold',
            value: formatHdlStatus(derivedMetrics.hdlThreshold, derivedMetrics.isHdlLow),
          },
          { label: dataLabels.triglyceride ?? 'Triglycerides (TG)', value: formatNumberWithUnit(bpAndLipids.triglycerideMgDl, 'mg/dL') },
          { label: dataLabels.tgMed ?? 'Using TG medication', value: formatBooleanChoice(bpAndLipids.usesTriglycerideMedication) },
          {
            label: dataLabels.metabolicCount ?? 'Metabolic syndrome components met',
            value: Number.isFinite(metabolicInfo.count) ? (labels.itemCount ?? '{count} item(s)').replace('{count}', metabolicInfo.count) : (labels.notCalculated ?? 'Not calculated'),
          },
        ],
      },
      {
        key: 'diabetes',
        title: dataSections.diabetes ?? 'Diabetes',
        items: [
          { label: dataLabels.diabetesDiagnosis ?? 'Diagnosed with diabetes', value: formatBooleanChoice(diabetes.hasDiagnosis) },
          { label: dataLabels.diabetesMed ?? 'Using diabetes medication', value: formatBooleanChoice(diabetes.usesMedication) },
          { label: dataLabels.fastingGlucose ?? 'Recent fasting glucose', value: formatNumberWithUnit(diabetes.fastingGlucoseMgDl, 'mg/dL') },
        ],
      },
      {
        key: 'kidney',
        title: dataSections.kidney ?? 'Kidney Function',
        items: [
          { label: dataLabels.ckdDiagnosis ?? 'Diagnosed with CKD', value: formatBooleanChoice(kidney.hasCkdDiagnosis) },
          { label: dataLabels.egfr ?? 'Recent eGFR', value: formatNumberWithUnit(kidney.egfr, 'mL/min/1.73m²') },
          { label: dataLabels.uacr ?? 'Recent UACR', value: formatNumberWithUnit(kidney.uacr, 'mg/g') },
        ],
      },
      {
        key: 'history',
        title: dataSections.history ?? 'Medical History',
        items: historyItems,
      },
    ]
  }, [dataLabels, dataSections, derivedMetrics, fmt, formData, labels, medicalCopy, metabolicInfo.count])

  const evaluatedAtDisplay = report.evaluatedAt ? new Date(report.evaluatedAt).toLocaleString() : ''

  const summaryHighlight = (() => {
    switch (report.levelCode) {
      case 'extremely_high':
        return styles.levelChipCritical
      case 'very_high':
        return styles.levelChipSevere
      case 'high':
        return styles.levelChipHigh
      case 'medium':
        return styles.levelChipMedium
      case 'low':
        return styles.levelChipLow
      case 'no_risk':
        return styles.levelChipNoRisk
      default:
        return styles.levelChipNeutral
    }
  })()

  const instantValue = loading
    ? (reportCopy.sidebarStatus?.calculating ?? 'Calculating')
    : error
      ? (reportCopy.sidebarStatus?.failed ?? 'Temporarily unavailable')
      : translatedLevel || '--'

  const instantDescription = loading
    ? (reportCopy.sidebarDescription?.calculating ?? 'Analyzing your data...')
    : error
      ? (reportCopy.sidebarDescription?.failed ?? 'Please recalculate or try again later.')
      : levelDescription

  const diagnosisMessage = showLdlTarget
    ? (labels.ldlTargetMessage ?? 'Based on guidelines, your LDL-C target is:【{target}】').replace('{target}', ldlTarget)
    : (!report.levelCode || report.levelCode === 'undefined')
      ? (labels.incompleteData ?? 'Insufficient data: please complete age, gender, blood pressure, and lipid measurements.')
      : (labels.noRiskDetected ?? 'No cardiovascular risk conditions detected. Maintain a healthy routine.')

  const reportStepIndex = steps.findIndex((step) => step.key === 'report')
  const stepLabel = reportStepIndex >= 0 ? `Step ${reportStepIndex + 1}` : 'Step'

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>{reportCopy.title ?? 'Risk Report'}</h2>
        </div>
        <p className={styles.lead}>
          {reportCopy.lead ?? 'Based on your health data, we have completed cardiovascular risk stratification.'}
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          {loading ? (
            <div className={styles.loading}>
              <LoadingSpinner label={reportCopy.loading ?? 'Calculating your risk...'} />
              <p className={styles.loadingHint}>{reportCopy.loadingHint ?? 'This takes about 1-2 seconds.'}</p>
            </div>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}

          {!loading && !error && report?.level ? (
            <>
              <section className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <div className={styles.summaryHeaderContent}>
                    <span className={styles.levelLabel}>{sectionTitles.mainResult ?? 'Main Result'}</span>
                    <h3 className={styles.summaryTitle}>
                      {(labels.resultTitle ?? 'Your cardiovascular risk level is: 【{level}】').replace('{level}', translatedLevel)}
                    </h3>
                  </div>
                  <span className={`${styles.levelChip} ${summaryHighlight}`}>{translatedLevel}</span>
                </div>
                <p className={styles.levelDescription}>{levelDescription}</p>

                <div className={styles.highlightCard}>
                  <h4 className={styles.highlightTitle}>{sectionTitles.diagnosis ?? 'Diagnosis Recommendation'}</h4>
                  <p className={styles.highlightLead}>{diagnosisMessage}</p>
                </div>

                <div className={styles.summarySection}>
                  <h4 className={styles.sectionHeading}>{sectionTitles.judgement ?? 'Assessment Rationale'}</h4>
                  <p className={styles.sectionText}>{judgement.message}</p>
                  {judgement.items.length ? (
                    <div className={styles.tagList}>
                      {judgement.items.map((item) => (
                        <span key={item} className={styles.tag}>
                          【{item}】
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {evaluatedAtDisplay ? (
                  <p className={styles.evaluatedAt}>
                    {(labels.evaluatedAt ?? 'Evaluated at: {time}').replace('{time}', evaluatedAtDisplay)}
                  </p>
                ) : null}
              </section>

              <section className={styles.detailGrid}>
                <article className={styles.detailCard}>
                  <header>
                    <h3>{sectionTitles.riskFactors ?? 'Cardiovascular Risk Factors'}</h3>
                    {Number.isFinite(report.riskFactorCount) ? (
                      <span className={styles.countBadge}>
                        {(labels.itemCount ?? '{count} item(s)').replace('{count}', report.riskFactorCount)}
                      </span>
                    ) : null}
                  </header>
                  <ul className={styles.factorGrid}>
                    {riskFactorItems.map((factor) => (
                      <li
                        key={factor.code}
                        className={factor.present ? styles.factorActive : styles.factorMuted}
                      >
                        <span className={styles.factorStatus} aria-hidden="true">
                          {factor.present ? '✓' : '—'}
                        </span>
                        <span>{factor.label}</span>
                      </li>
                    ))}
                  </ul>
                  {!riskFactorItems.length ? (
                    <p className={styles.fallbackText}>
                      {labels.noRiskFactors ?? 'No common risk factors detected.'}
                    </p>
                  ) : null}
                </article>

                <article className={styles.detailCard}>
                  <header>
                    <h3>{sectionTitles.metabolicSyndrome ?? 'Metabolic Syndrome Components'}</h3>
                    <span className={styles.countBadge}>
                      {Number.isFinite(metabolicInfo.count) ? (labels.of5Items ?? '{count} / 5 items').replace('{count}', metabolicInfo.count) : (labels.notCalculated ?? 'Not calculated')}
                    </span>
                  </header>
                  <ul className={styles.factorGrid}>
                    {metabolicComponents.map((item) => (
                      <li
                        key={item.key}
                        className={item.present ? styles.factorActive : styles.factorMuted}
                      >
                        <span className={styles.factorStatus} aria-hidden="true">
                          {item.present ? '✓' : '—'}
                        </span>
                        <span>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                  {Number.isFinite(metabolicInfo.count) && metabolicInfo.count >= 3 ? (
                    <p className={styles.emphasisText}>
                      {labels.metabolicMet ?? 'Metabolic syndrome criteria met.'}
                    </p>
                  ) : (
                    <p className={styles.fallbackText}>
                      {labels.metabolicNotMet ?? 'Below 3-item threshold.'}
                    </p>
                  )}
                </article>
              </section>

              <section className={styles.overview}>
                <h3>{sectionTitles.dataOverview ?? 'Data Overview'}</h3>
                <div className={styles.overviewGrid}>
                  {dataOverviewSections.map((section) => (
                    <article
                      key={section.key}
                      className={
                        section.key === 'history'
                          ? `${styles.overviewCard} ${styles.overviewCardWide}`
                          : styles.overviewCard
                      }
                    >
                      <h4 className={styles.overviewTitle}>{section.title}</h4>
                      <dl className={styles.dataList}>
                        {section.items.map((item) => (
                          <div key={item.label} className={styles.dataRow}>
                            <dt className={styles.dataLabel}>{item.label}</dt>
                            <dd className={styles.dataValue}>{item.value}</dd>
                          </div>
                        ))}
                      </dl>
                    </article>
                  ))}
                </div>
              </section>

              <section className={styles.recommendations}>
                <h3>{sectionTitles.recommendations ?? 'Recommendations'}</h3>
                {translatedRecommendations?.length ? (
                  <ul>
                    {translatedRecommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.fallbackText}>{labels.noRecommendations ?? 'No additional recommendations.'}</p>
                )}
              </section>

              <section className={styles.disclaimer}>
                <h3>{sectionTitles.disclaimer ?? 'Disclaimer'}</h3>
                <p>
                  {labels.disclaimerText ?? 'This tool provides health information for reference only and cannot replace professional medical advice.'}
                </p>
              </section>
            </>
          ) : null}
        </div>

        <aside className={styles.sidebar}>
          <InstantResult label={reportCopy.instantLabel ?? 'Live Status'} value={instantValue} description={instantDescription} />
          <div className={styles.sidebarActions}>
            <Button type="button" variant="ghost" onClick={handleExitReport} disabled={loading}>
              {reportCopy.buttons?.exit ?? 'Exit Report'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => runCalculation(true)} disabled={loading}>
              {reportCopy.buttons?.recalc ?? 'Recalculate'}
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
