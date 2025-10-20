import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { LoadingSpinner } from '../components/ui/LoadingSpinner.jsx'
import { InstantResult } from '../components/ui/InstantResult.jsx'
import { useFormContext } from '../context/FormContext.jsx'
import { calculateRisk } from '../utils/mockApi.js'
import styles from './Step4_Report.module.css'

const formatPercentage = (value) => `${value.toFixed(1)}%`

export const Step4_Report = () => {
  const {
    formData,
    updateFormSection,
    markCurrentStepCompleted,
    StepStatus,
    stepStatus,
    setStepStatus,
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
      const result = await calculateRisk(formData)
      updateFormSection('report', {
        ...result,
        generatedAt: new Date().toISOString(),
      })
      markCurrentStepCompleted()
      setStepStatus('report', StepStatus.COMPLETED)
    } catch (err) {
      setError('計算風險時發生問題，請稍後再試。')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (report?.riskScore == null && !loading) {
      runCalculation()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const comparison = useMemo(() => {
    if (report?.riskScore == null || report?.populationAverage == null) return null

    const user = report.riskScore
    const population = report.populationAverage
    const total = Math.max(user, population, 25)

    return {
      userWidth: Math.min(100, (user / total) * 100),
      populationWidth: Math.min(100, (population / total) * 100),
    }
  }, [report?.riskScore, report?.populationAverage])

  const generatedDate = report.generatedAt
    ? new Date(report.generatedAt).toLocaleString()
    : ''

  return (
    <section className={styles.container}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Step 4</p>
          <h2>風險報告</h2>
        </div>
        <p className={styles.lead}>
          根據您提供的健康資料，我們整理出心血管風險評估結果與建議。建議定期與專業醫護人員討論後續追蹤或治療計畫。
        </p>
      </header>

      <div className={styles.layout}>
        <div className={styles.main}>
          {loading ? (
            <div className={styles.loading}>
              <LoadingSpinner label="正在計算您的風險..." />
              <p className={styles.loadingHint}>此步驟模擬後端計算，約需 1-2 秒。</p>
            </div>
          ) : null}

          {error ? <p className={styles.error}>{error}</p> : null}

          {!loading && !error && report?.riskScore != null ? (
            <>
              <section className={styles.scoreCard}>
                <div className={styles.scoreValue}>
                  <span className={styles.scoreNumber}>{formatPercentage(report.riskScore)}</span>
                  <span className={styles.scoreLevel}>{report.riskLevel}度風險</span>
                </div>
                <p className={styles.scoreSummary}>
                  風險值代表未來 10 年內發生重大心血管事件的機率。請搭配生活型態與醫療建議，持續追蹤。
                </p>
                {generatedDate ? (
                  <p className={styles.generatedAt}>更新時間：{generatedDate}</p>
                ) : null}
              </section>

              {comparison ? (
                <section className={styles.comparison}>
                  <h3>與同齡族群比較</h3>
                  <div className={styles.barGroup}>
                    <div className={styles.barLabel}>
                      <span>您的風險</span>
                      <strong>{formatPercentage(report.riskScore)}</strong>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barUser}
                        style={{ width: `${comparison.userWidth}%` }}
                      />
                    </div>
                  </div>
                  <div className={styles.barGroup}>
                    <div className={styles.barLabel}>
                      <span>同齡健康族群</span>
                      <strong>{formatPercentage(report.populationAverage)}</strong>
                    </div>
                    <div className={styles.barTrack}>
                      <div
                        className={styles.barAvg}
                        style={{ width: `${comparison.populationWidth}%` }}
                      />
                    </div>
                  </div>
                  <p className={styles.difference}>
                    相較同齡族群 {report.relativeDifference >= 0 ? '高出' : '低於'}
                    {' '}
                    {Math.abs(report.relativeDifference).toFixed(1)} 個百分點。
                  </p>
                </section>
              ) : null}

              <section className={styles.factors}>
                <h3>主要風險因子</h3>
                {report.factors?.length ? (
                  <ul className={styles.factorList}>
                    {report.factors.map((factor) => (
                      <li key={factor} className={styles.factorItem}>
                        {factor}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>您的資料尚未顯示明顯的風險因子，請持續保持健康生活。</p>
                )}
              </section>

              <section className={styles.recommendations}>
                <h3>建議行動</h3>
                <ul>
                  {report.recommendations?.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            </>
          ) : null}
        </div>

        <aside className={styles.sidebar}>
          <InstantResult
            label="即時狀態"
            value={
              loading
                ? '計算中'
                : error
                ? '暫時失敗'
                : report?.riskLevel
                ? `${report.riskLevel}度風險`
                : '--'
            }
            description={
              loading
                ? '我們正在彙整您的資料以產出風險分析。'
                : error
                ? '請重新計算或稍後再試。'
                : '保持健康生活與規律追蹤，可有效降低風險。'
            }
          />
          <div className={styles.sidebarActions}>
            <Button onClick={runCalculation} variant="secondary" disabled={loading}>
              重新計算
            </Button>
            <Button type="button" disabled={loading}>
              下載 PDF 報告
            </Button>
          </div>
        </aside>
      </div>
    </section>
  )
}
