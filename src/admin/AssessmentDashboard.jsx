import { useEffect, useMemo, useState } from 'react'
import { Button } from '../components/ui/Button.jsx'
import { fetchAssessmentDashboard } from '../utils/adminApi.js'
import styles from './AssessmentDashboard.module.css'

const LEVEL_LABELS = {
  extremely_high: '極高',
  very_high: '非常高',
  high: '高',
  medium: '中',
  low: '低',
  undefined: '未定義',
}

const CHIP_CLASSES = {
  extremely_high: styles.chipExtremelyHigh,
  very_high: styles.chipVeryHigh,
  high: styles.chipHigh,
  medium: styles.chipMedium,
  low: styles.chipLow,
  undefined: styles.chipUndefined,
}

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString()
}

export const AssessmentDashboard = () => {
  const [dashboard, setDashboard] = useState({ stats: null, assessments: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [limit, setLimit] = useState(20)
  const [selectedLevel, setSelectedLevel] = useState('all')

  const loadData = async (nextLimit = limit) => {
    try {
      setLoading(true)
      setError(null)
      const result = await fetchAssessmentDashboard({ limit: nextLimit })
      setDashboard(result)
    } catch (err) {
      setError(err.message || '無法載入評估紀錄')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(limit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit])

  const filteredAssessments = useMemo(() => {
    if (selectedLevel === 'all') return dashboard.assessments ?? []
    return (dashboard.assessments ?? []).filter(
      (record) => record.levelCode === selectedLevel,
    )
  }, [dashboard.assessments, selectedLevel])

  const stats = dashboard.stats ?? {
    totalAssessments: 0,
    byLevel: {},
    averageRiskFactorCount: null,
    latestAssessmentAt: null,
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>資料載入中，請稍候...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.error}>
          <strong>載入失敗：</strong>
          <span>{error}</span>
          <div>
            <Button onClick={() => loadData(limit)} variant="secondary">
              重新整理
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1>心血管評估資料概覽</h1>
          <p>
            快速瀏覽最新的評估紀錄、風險層級分佈與原始量測資料，支援醫師即時掌握病患狀況。
          </p>
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.muted}>
            顯示筆數：
            <select
              value={limit}
              onChange={(event) => setLimit(Number.parseInt(event.target.value, 10))}
            >
              {[10, 20, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <Button onClick={() => loadData(limit)} variant="secondary">
            重新整理
          </Button>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span>總評估次數</span>
          <strong>{stats.totalAssessments}</strong>
          <p className={styles.muted}>
            最新評估時間：{formatDateTime(stats.latestAssessmentAt)}
          </p>
        </div>
        <div className={styles.statCard}>
          <span>平均危險因子數</span>
          <strong>
            {stats.averageRiskFactorCount !== null
              ? stats.averageRiskFactorCount.toFixed(1)
              : '—'}
          </strong>
          <p className={styles.muted}>含所有風險層級</p>
        </div>
        <div className={styles.statCard}>
          <span>風險層級分佈</span>
          <div className={styles.tags}>
            {Object.entries(LEVEL_LABELS).map(([code, label]) => (
              <span key={code} className={styles.tag}>
                {label}：{stats.byLevel?.[code] ?? 0}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.filters}>
        <div className={styles.filterGroup}>
          <span className={styles.muted}>篩選層級：</span>
          <button
            type="button"
            className={`${styles.filterButton} ${
              selectedLevel === 'all' ? styles.filterButtonActive : ''
            }`}
            onClick={() => setSelectedLevel('all')}
          >
            全部
          </button>
          {Object.entries(LEVEL_LABELS).map(([code, label]) => (
            <button
              key={code}
              type="button"
              className={`${styles.filterButton} ${
                selectedLevel === code ? styles.filterButtonActive : ''
              }`}
              onClick={() => setSelectedLevel(code)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={styles.muted}>
          共 {filteredAssessments.length} 筆符合條件的評估紀錄
        </p>
      </section>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>建立時間</th>
              <th>風險層級</th>
              <th>危險因子</th>
              <th>命中規則</th>
              <th>代謝症候群</th>
              <th>原始請求資料</th>
            </tr>
          </thead>
          <tbody>
            {filteredAssessments.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.muted}>
                  尚未有符合條件的評估紀錄。
                </td>
              </tr>
            ) : (
              filteredAssessments.map((record) => (
                <tr key={record.id}>
                  <td>{formatDateTime(record.createdAt)}</td>
                  <td>
                    <span
                      className={`${styles.levelChip} ${
                        CHIP_CLASSES[record.levelCode] ?? styles.chipUndefined
                      }`}
                    >
                      {LEVEL_LABELS[record.levelCode] ?? record.level}
                    </span>
                  </td>
                  <td>
                    <div className={styles.metabolicBadge}>
                      <span>{record.riskFactorCount} 項</span>
                    </div>
                    <div className={styles.tags}>
                      {record.riskFactors
                        .filter((item) => item.present)
                        .map((item) => (
                          <span key={item.code} className={styles.tag}>
                            {item.label}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>
                    <div className={styles.tags}>
                      {record.matchedRules.length
                        ? record.matchedRules.map((rule) => (
                            <span key={rule.code} className={styles.tag}>
                              {rule.label}
                            </span>
                          ))
                        : '—'}
                    </div>
                  </td>
                  <td>
                    <div>
                      <strong>{record.metabolicSyndrome.count} / 5</strong>
                    </div>
                    <div className={styles.tags}>
                      {Object.entries(record.metabolicSyndrome.components ?? {})
                        .filter(([, present]) => present)
                        .map(([key]) => (
                          <span key={key} className={styles.tag}>
                            {key}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td>
                    <details>
                      <summary>檢視 JSON</summary>
                      <pre className={styles.payloadDetails}>
                        {JSON.stringify(record.payload, null, 2)}
                      </pre>
                    </details>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

