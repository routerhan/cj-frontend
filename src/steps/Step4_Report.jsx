import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { requestRiskAssessment } from '../utils/riskApi.js'
import styles from './Step4_Report.module.css'

const LEVEL_DESCRIPTION = {
  extremely_high: '屬於最高優先等級，建議立即與專業醫療團隊討論侵入性治療與用藥策略。',
  very_high: '已確診 ASCVD 或顯著斑塊負擔，需密集追蹤並調整危險因子。',
  high: '具備重大慢性病或高危險生化指標，請積極管理血脂、血壓與血糖。',
  medium: '累積多項心血管危險因子，應加強生活型態並定期追蹤。',
  low: '目前僅具備單一心血管危險因子，建議持續維護健康習慣。',
  undefined: '目前未偵測到特定風險條件，請持續維持健康作息與定期追蹤。',
}

const LDL_TARGETS = {
  extremely_high: '<55 mg/dL',
  very_high: '<70 mg/dL',
  high: '<100 mg/dL',
  medium: '<115 mg/dL',
  low: '<130 mg/dL',
  undefined: '請諮詢專業醫師設定個人化目標',
}

const METABOLIC_COMPONENT_LABELS = {
  abdominalObesity: '腹部肥胖（腰圍門檻）',
  elevatedBloodPressure: '血壓偏高或治療中',
  elevatedGlucose: '空腹血糖偏高或使用降糖藥',
  elevatedTriglyceride: '三酸甘油酯偏高或治療中',
  lowHdl: 'HDL-C 偏低',
}

const COUNT_ONLY_RULE_CODES = new Set(['risk_factor_count', 'single_risk_factor'])

const hasData = (value) => value !== null && value !== undefined && value !== ''

const formatBooleanChoice = (value) => {
  if (value === true || value === 'yes') return '是'
  if (value === false || value === 'no') return '否'
  return '未填'
}

const formatSex = (value) => {
  if (value === 'male') return '男'
  if (value === 'female') return '女'
  if (value === 'other' || value === '其他') return '其他'
  return '未填'
}

const formatCacCategory = (value) => {
  if (value === 'yes') return '是 (≥ 400)'
  if (value === 'no') return '否 (< 400)'
  if (value === 'unknown') return '不知道'
  return '未填'
}

const formatNumberWithUnit = (value, unit) => {
  if (!hasData(value)) return '未填'
  return unit ? `${value} ${unit}` : String(value)
}

const formatBloodPressure = (systolic, diastolic) => {
  const hasSystolic = hasData(systolic)
  const hasDiastolic = hasData(diastolic)
  if (hasSystolic && hasDiastolic) return `${systolic} / ${diastolic} mmHg`
  if (hasSystolic) return `${systolic} mmHg`
  if (hasDiastolic) return `${diastolic} mmHg`
  return '未填'
}

const formatDerived = (value, suffix) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '未計算'
  return suffix ? `${value}${suffix}` : String(value)
}

const formatWaistStatus = (waist) => {
  if (!waist || waist.threshold === null) return '未計算'
  return `${waist.isObese ? '是' : '否'}（門檻 ${waist.threshold} cm）`
}

const formatHdlStatus = (threshold, isLow) => {
  if (threshold === null || threshold === undefined) return '未計算'
  return `${isLow ? '是' : '否'}（門檻 ${threshold} mg/dL）`
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
      setError(err.message || '計算風險時發生問題，請稍後再試。')
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

  const levelDescription = LEVEL_DESCRIPTION[report.levelCode] ?? LEVEL_DESCRIPTION.undefined
  const ldlTarget = LDL_TARGETS[report.levelCode] ?? LDL_TARGETS.undefined
  const showLdlTarget = report.levelCode && report.levelCode !== 'undefined'

  const matchedRules = report.matchedRules ?? []
  const riskFactorItems = report.riskFactors ?? []
  const metabolicInfo = report.metabolicSyndrome ?? { count: 0, components: {} }

  const judgement = useMemo(() => {
    const levelName = report.level ?? '未定義'

    if (report.levelCode === 'undefined' || !report.levelCode) {
      return {
        message: '目前未偵測到符合的心血管風險條件，代表您維持良好狀態，請持續保持健康生活與定期健康檢查。',
        items: [],
      }
    }
    const triggeredRiskFactors = riskFactorItems.filter((item) => item.present).map((item) => item.label)
    const meaningfulRules = matchedRules.filter((rule) => !COUNT_ONLY_RULE_CODES.has(rule.code))

    if (meaningfulRules.length > 0) {
      const labels = meaningfulRules.map((rule) => rule.label)
      const base = `您被歸類為${levelName}風險，因為您符合以下條件`
      return {
        message: labels.length > 0 ? `${base}：` : `${base}。`,
        items: labels,
      }
    }

    if (triggeredRiskFactors.length > 0) {
      const base = `您符合 ${triggeredRiskFactors.length} 項心血管危險因子`
      return {
        message: `${base}：`,
        items: triggeredRiskFactors,
      }
    }

    return {
      message: `您被歸類為${levelName}風險，請持續維持健康生活型態並定期追蹤。`,
      items: [],
    }
  }, [matchedRules, report.level, report.levelCode, riskFactorItems])

  const metabolicComponents = useMemo(() => {
    const components = metabolicInfo.components ?? {}
    return Object.entries(METABOLIC_COMPONENT_LABELS).map(([key, label]) => ({
      key,
      label,
      present: Boolean(components[key]),
    }))
  }, [metabolicInfo.components])

  const dataOverviewSections = useMemo(() => {
    const basic = formData.basic ?? {}
    const bpAndLipids = formData.bpAndLipids ?? {}
    const diabetes = formData.diabetes ?? {}
    const kidney = formData.kidney ?? {}
    const history = formData.history ?? {}
    const vascular = history.vascularDiseases ?? {}
    const cadDetails = history.cadDetails ?? {}

    return [
      {
        key: 'basic',
        title: '基本資料',
        items: [
          { label: '生理性別', value: formatSex(basic.sex) },
          { label: '出生年月日', value: hasData(basic.birthDate) ? basic.birthDate : '未填' },
          { label: '年齡', value: formatDerived(derivedMetrics.ageYears, ' 歲') },
          { label: '身高', value: formatNumberWithUnit(basic.heightCm, 'cm') },
          { label: '體重', value: formatNumberWithUnit(basic.weightKg, 'kg') },
          { label: 'BMI', value: formatDerived(derivedMetrics.bmi) },
          { label: '腰圍', value: formatNumberWithUnit(basic.waistCm, 'cm') },
          { label: '腹部肥胖判定', value: formatWaistStatus(derivedMetrics.waist) },
          { label: '目前是否抽菸', value: formatBooleanChoice(basic.currentSmoker) },
          { label: '早發性冠心病家族史', value: formatBooleanChoice(basic.familyHistoryEarlyChd) },
        ],
      },
      {
        key: 'bpAndLipids',
        title: '血壓與血脂',
        items: [
          { label: '是否使用降血壓藥物', value: formatBooleanChoice(bpAndLipids.usesHypertensionMedication) },
          { label: '最近血壓', value: formatBloodPressure(bpAndLipids.systolic, bpAndLipids.diastolic) },
          { label: 'LDL-C', value: formatNumberWithUnit(bpAndLipids.ldlMgDl, 'mg/dL') },
          { label: 'HDL-C', value: formatNumberWithUnit(bpAndLipids.hdlMgDl, 'mg/dL') },
          {
            label: 'HDL-C 是否低於門檻',
            value: formatHdlStatus(derivedMetrics.hdlThreshold, derivedMetrics.isHdlLow),
          },
          { label: '三酸甘油酯 (TG)', value: formatNumberWithUnit(bpAndLipids.triglycerideMgDl, 'mg/dL') },
          { label: '是否使用 TG 藥物', value: formatBooleanChoice(bpAndLipids.usesTriglycerideMedication) },
          {
            label: '代謝症候群命中數',
            value: Number.isFinite(metabolicInfo.count) ? `${metabolicInfo.count} 項` : '未計算',
          },
        ],
      },
      {
        key: 'diabetes',
        title: '糖尿病',
        items: [
          { label: '是否被醫師診斷糖尿病', value: formatBooleanChoice(diabetes.hasDiagnosis) },
          { label: '是否使用糖尿病藥物', value: formatBooleanChoice(diabetes.usesMedication) },
          { label: '最近空腹血糖', value: formatNumberWithUnit(diabetes.fastingGlucoseMgDl, 'mg/dL') },
        ],
      },
      {
        key: 'kidney',
        title: '腎臟功能',
        items: [
          { label: '是否被診斷慢性腎臟病', value: formatBooleanChoice(kidney.hasCkdDiagnosis) },
          { label: '最近 eGFR', value: formatNumberWithUnit(kidney.egfr, 'mL/min/1.73m²') },
          { label: '最近 UACR', value: formatNumberWithUnit(kidney.uacr, 'mg/g') },
        ],
      },
      {
        key: 'history',
        title: '心血管病史',
        items: [
          { label: '最近 CAC 是否 ≥ 400', value: formatCacCategory(history.cacScoreCategory) },
          { label: '影像顯示顯著斑塊 (≥50%)', value: formatBooleanChoice(history.hasSignificantPlaque) },
          { label: '是否臨床診斷 ASCVD', value: formatBooleanChoice(history.hasAscvdDiagnosis) },
          { label: '冠狀動脈疾病 (CAD)', value: formatBooleanChoice(vascular.cad) },
          {
            label: 'CAD 詳細 - 一年內心肌梗塞',
            value: formatBooleanChoice(cadDetails.miWithin1Year),
          },
          {
            label: 'CAD 詳細 - 累積兩次以上心肌梗塞',
            value: formatBooleanChoice(cadDetails.miHistoryCountTwoOrMore),
          },
          {
            label: 'CAD 詳細 - 多支血管阻塞',
            value: formatBooleanChoice(cadDetails.hasMultiVesselObstruction),
          },
          { label: '周邊動脈疾病 (PAD)', value: formatBooleanChoice(vascular.pad) },
          { label: '頸動脈狹窄', value: formatBooleanChoice(vascular.carotidStenosis) },
        ],
      },
    ]
  }, [derivedMetrics, formData, metabolicInfo.count])

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
      default:
        return styles.levelChipNeutral
    }
  })()

  const instantValue = loading ? '計算中' : error ? '暫時失敗' : report.level || '--'

  const instantDescription = loading
    ? '我們正在根據最新規則彙整您的資料。'
    : error
    ? '請重新計算或稍後再試。'
    : levelDescription

  const diagnosisMessage = showLdlTarget
    ? `根據指引，您的 LDL-C (低密度脂蛋白) 建議目標為：【${ldlTarget}】`
    : '目前未偵測到心血管風險條件，請持續維持良好作息並定期追蹤基本健康指標。'

  const reportStepIndex = steps.findIndex((step) => step.key === 'report')
  const stepLabel = reportStepIndex >= 0 ? `Step ${reportStepIndex + 1}` : 'Step'

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>{stepLabel}</p>
          <h2>風險報告</h2>
        </div>
        <p className={styles.lead}>
          根據您提供的健康資料，我們已完成心血管風險分級，並整理對應的 LDL-C 目標、判斷依據與完整數據概覽。
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          {loading ? (
            <div className={styles.loading}>
              <LoadingSpinner label="正在計算您的風險..." />
              <p className={styles.loadingHint}>此步驟模擬後端服務回應，約需 1-2 秒。</p>
            </div>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}

          {!loading && !error && report?.level ? (
            <>
              <section className={styles.summaryCard}>
                <div className={styles.summaryHeader}>
                  <div className={styles.summaryHeaderContent}>
                    <span className={styles.levelLabel}>主要結果</span>
                    <h3 className={styles.summaryTitle}>
                      您的心血管風險等級為：【{report.level}】
                    </h3>
                  </div>
                  <span className={`${styles.levelChip} ${summaryHighlight}`}>{report.level}</span>
                </div>
                <p className={styles.levelDescription}>{levelDescription}</p>

                <div className={styles.summarySection}>
                  <h4 className={styles.sectionHeading}>診斷建議</h4>
                  <p className={styles.sectionText}>{diagnosisMessage}</p>
                </div>

                <div className={styles.summarySection}>
                  <h4 className={styles.sectionHeading}>判斷依據</h4>
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
                  <p className={styles.evaluatedAt}>評估時間：{evaluatedAtDisplay}</p>
                ) : null}
              </section>

              <section className={styles.detailGrid}>
                <article className={styles.detailCard}>
                  <header>
                    <h3>心血管危險因子</h3>
                    {Number.isFinite(report.riskFactorCount) ? (
                      <span className={styles.countBadge}>{report.riskFactorCount} 項</span>
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
                      未偵測到常見危險因子，請持續維持健康的生活型態。
                    </p>
                  ) : null}
                </article>

                <article className={styles.detailCard}>
                  <header>
                    <h3>代謝症候群構成</h3>
                    <span className={styles.countBadge}>
                      {Number.isFinite(metabolicInfo.count) ? `${metabolicInfo.count} / 5 項` : '未計算'}
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
                      已符合代謝症候群定義，建議與醫師討論減重、飲食及用藥策略。
                    </p>
                  ) : (
                    <p className={styles.fallbackText}>
                      未達 3 項門檻，請持續追蹤腰圍、血壓與血脂變化。
                    </p>
                  )}
                </article>
              </section>

              <section className={styles.overview}>
                <h3>數據總覽</h3>
                <div className={styles.overviewGrid}>
                  {dataOverviewSections.map((section) => (
                    <article key={section.key} className={styles.overviewCard}>
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
                <h3>後續建議</h3>
                {report.recommendations?.length ? (
                  <ul>
                    {report.recommendations.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p className={styles.fallbackText}>目前沒有額外建議。</p>
                )}
              </section>

              <section className={styles.disclaimer}>
                <h3>免責聲明</h3>
                <p>
                  本工具僅提供健康資訊參考，無法取代專業醫療建議。若您對自身狀況或治療方案有任何疑慮，請儘速諮詢醫師或專業醫護人員。
                </p>
              </section>
            </>
          ) : null}
        </div>

        <aside className={styles.sidebar}>
          <InstantResult label="即時狀態" value={instantValue} description={instantDescription} />
          <div className={styles.sidebarActions}>
            <Button type="button" variant="ghost" onClick={handleExitReport} disabled={loading}>
              退出報告
            </Button>
            <Button type="button" variant="secondary" onClick={() => runCalculation(true)} disabled={loading}>
              重新計算
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
