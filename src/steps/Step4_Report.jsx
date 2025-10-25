import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { requestRiskAssessment } from '../utils/riskApi.js'
import styles from './Step4_Report.module.css'

const LEVEL_DESCRIPTION = {
  extremely_high: '屬於最高優先等級，建議立即與專業醫療團隊討論侵入性治療與用藥策略。',
  very_high: '已確診 ASCVD 或顯著斑塊負擔，需密集追蹤並調整風險因子。',
  high: '具備重大慢性病或高危險生化指標，請積極管理血脂、血壓與血糖。',
  medium: '累積多項心血管危險因子，應加強生活型態與定期追蹤。',
  low: '目前僅具備單一心血管危險因子，建議持續維護健康習慣。',
  undefined: '資料尚不足以判定風險層級，請補充更多臨床或檢驗資訊。',
}

const METABOLIC_COMPONENT_LABELS = {
  abdominalObesity: '腹部肥胖（腰圍門檻）',
  elevatedBloodPressure: '血壓偏高或治療中',
  elevatedGlucose: '空腹血糖偏高或使用降糖藥',
  elevatedTriglyceride: '三酸甘油酯偏高或治療中',
  lowHdl: 'HDL-C 偏低',
}

const hasData = (value) => value !== null && value !== undefined && value !== ''

export const Step4_Report = () => {
  const {
    formData,
    updateFormSection,
    markCurrentStepCompleted,
    StepStatus,
    stepStatus,
    setStepStatus,
    steps,
  } = useFormContext()

  const report = formData.report ?? {}
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const ensureStepInProgress = () => {
    if (stepStatus.report === StepStatus.COMPLETED) {
      setStepStatus('report', StepStatus.IN_PROGRESS)
    }
  }

  const runCalculation = async () => {
    try {
      ensureStepInProgress()
      setLoading(true)
      setError(null)
      const result = await requestRiskAssessment(formData)
      updateFormSection('report', result)
      markCurrentStepCompleted()
      setStepStatus('report', StepStatus.COMPLETED)
    } catch (err) {
      setError(err.message || '計算風險時發生問題，請稍後再試。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!report?.level && !loading) {
      runCalculation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const levelDescription = LEVEL_DESCRIPTION[report.levelCode] ?? LEVEL_DESCRIPTION.undefined

  const matchedRules = report.matchedRules ?? []
  const riskFactorItems = report.riskFactors ?? []
  const metabolicInfo = report.metabolicSyndrome ?? { count: 0, components: {} }

  const metabolicComponents = useMemo(() => {
    const components = metabolicInfo.components ?? {}
    return Object.entries(METABOLIC_COMPONENT_LABELS).map(([key, label]) => ({
      key,
      label,
      present: Boolean(components[key]),
    }))
  }, [metabolicInfo.components])

  const evaluatedAtDisplay = report.evaluatedAt
    ? new Date(report.evaluatedAt).toLocaleString()
    : ''

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

  const instantValue = loading
    ? '計算中'
    : error
    ? '暫時失敗'
    : report.level || '--'

  const instantDescription = loading
    ? '我們正在根據最新規則彙整您的資料。'
    : error
    ? '請重新計算或稍後再試。'
    : levelDescription

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
          根據您提供的健康資料，我們依照最新的風險分級邏輯判定心血管優先級，並整理出對應的醫療建議與需關注的危險因子。
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
                  <span className={styles.levelLabel}>此次評估結果</span>
                  <span className={`${styles.levelChip} ${summaryHighlight}`}>
                    {report.level}
                  </span>
                </div>
                <p className={styles.levelDescription}>{levelDescription}</p>
                {matchedRules.length ? (
                  <div className={styles.ruleSection}>
                    <h3>對應條件</h3>
                    <ul className={styles.ruleList}>
                      {matchedRules.map((rule) => (
                        <li key={rule.code}>{rule.label}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className={styles.ruleFallback}>
                    尚未命中極高、非常高或高風險條件，已依危險因子數計算層級。
                  </p>
                )}
                {evaluatedAtDisplay ? (
                  <p className={styles.evaluatedAt}>評估時間：{evaluatedAtDisplay}</p>
                ) : null}
              </section>

              <section className={styles.detailGrid}>
                <article className={styles.detailCard}>
                  <header>
                    <h3>心血管危險因子</h3>
                    {Number.isFinite(report.riskFactorCount) ? (
                      <span className={styles.countBadge}>
                        {report.riskFactorCount} 項
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
                      未偵測到常見危險因子，請持續維持健康的生活型態。
                    </p>
                  ) : null}
                </article>

                <article className={styles.detailCard}>
                  <header>
                    <h3>代謝症候群構成</h3>
                    <span className={styles.countBadge}>
                      {metabolicInfo.count} / 5 項
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
                  {metabolicInfo.count >= 3 ? (
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

              <section className={styles.recommendations}>
                <h3>建議行動</h3>
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
            </>
          ) : null}
        </div>

        <aside className={styles.sidebar}>
          <InstantResult label="即時狀態" value={instantValue} description={instantDescription} />
          <div className={styles.sidebarActions}>
            <Button onClick={runCalculation} variant="secondary" disabled={loading}>
              重新計算
            </Button>
            <Button type="button" disabled={loading || !hasData(report.level)}>
              下載 PDF 報告
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
