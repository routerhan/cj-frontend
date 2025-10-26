"""風險評估 API 與後台資料檢視路由。"""

from collections import Counter

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from ..db.session import get_session
from ..repositories import AssessmentRepository
from ..schemas import (
    AssessmentListResponse,
    AssessmentRecord,
    AssessmentStats,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskLevelCodeEnum,
)
from ..services import RiskAssessmentServiceProtocol, get_risk_assessment_service

router = APIRouter(prefix="/api", tags=["risk-assessment"])


@router.post(
    "/risk-assessment",
    response_model=RiskAssessmentResponse,
    status_code=status.HTTP_200_OK,
)
async def create_risk_assessment(
    payload: RiskAssessmentRequest,
    service: RiskAssessmentServiceProtocol = Depends(get_risk_assessment_service),
) -> RiskAssessmentResponse:
    """
    接收前端送出的心血管風險評估資料，回傳符合契約的評估結果，
    並將請求與運算結果儲存至資料庫。
    """

    return service.evaluate(payload)


@router.get(
    "/admin/assessments",
    response_model=AssessmentListResponse,
    status_code=status.HTTP_200_OK,
)
async def list_assessments(
    limit: int = Query(50, ge=1, le=200),
    session: Session = Depends(get_session),
) -> AssessmentListResponse:
    """提供醫療儀表板使用的評估資料列表與統計。"""

    repository = AssessmentRepository(session)
    assessments = repository.list_recent_assessments(limit=limit)

    records: list[AssessmentRecord] = []
    total_risk_factors = 0

    for assessment in assessments:
        response_model = RiskAssessmentResponse.model_validate(assessment.result)
        payload_model = RiskAssessmentRequest.model_validate(assessment.payload)

        records.append(
            AssessmentRecord(
                id=assessment.id,
                createdAt=assessment.created_at,
                level=response_model.level,
                levelCode=response_model.levelCode,
                riskFactorCount=response_model.riskFactorCount,
                matchedRules=response_model.matchedRules,
                recommendations=response_model.recommendations,
                riskFactors=response_model.riskFactors,
                metabolicSyndrome=response_model.metabolicSyndrome,
                payload=payload_model,
            )
        )
        total_risk_factors += response_model.riskFactorCount

    by_level_counter = Counter(record.levelCode for record in records)
    by_level = {level: by_level_counter.get(level, 0) for level in RiskLevelCodeEnum}

    stats = AssessmentStats(
        totalAssessments=len(records),
        byLevel=by_level,
        averageRiskFactorCount=(
            total_risk_factors / len(records) if records else None
        ),
        latestAssessmentAt=records[0].createdAt if records else None,
    )

    return AssessmentListResponse(stats=stats, assessments=records)


DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <meta charset="utf-8" />
    <title>心血管評估資料儀表板</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light;
        font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        background: #f5f6f8;
        color: #1b1d21;
      }
      body {
        margin: 0;
        padding: 32px;
        display: flex;
        justify-content: center;
      }
      .container {
        width: min(1100px, 100%);
        display: flex;
        flex-direction: column;
        gap: 24px;
      }
      header h1 {
        margin: 0;
        font-size: 32px;
      }
      header p {
        margin: 8px 0 0;
        color: #555d6b;
      }
      .controls {
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        flex-wrap: wrap;
      }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 16px;
      }
      .card {
        background: #fff;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .card span {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6c7280;
      }
      .card strong {
        font-size: 26px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
      }
      thead {
        background: rgba(59, 130, 246, 0.08);
      }
      th, td {
        padding: 16px 18px;
        text-align: left;
        vertical-align: top;
        font-size: 14px;
      }
      tbody tr:nth-child(even) {
        background: #f9fafb;
      }
      .chip {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 12px;
        font-weight: 600;
      }
      .chip.extremely_high { background: rgba(220,38,38,0.12); color: #b91c1c; }
      .chip.very_high { background: rgba(249,115,22,0.15); color: #c2410c; }
      .chip.high { background: rgba(234,179,8,0.18); color: #b45309; }
      .chip.medium { background: rgba(59,130,246,0.15); color: #1d4ed8; }
      .chip.low { background: rgba(16,185,129,0.15); color: #047857; }
      .chip.undefined { background: rgba(107,114,128,0.15); color: #374151; }
      .tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 6px;
      }
      .tag {
        background: rgba(15, 23, 42, 0.06);
        color: #475569;
        border-radius: 6px;
        padding: 4px 8px;
        font-size: 12px;
      }
      .payload {
        background: #f3f4f6;
        border-radius: 12px;
        padding: 12px;
        max-height: 240px;
        overflow: auto;
        font-family: "JetBrains Mono", Menlo, Consolas, monospace;
        font-size: 12px;
        margin: 0;
      }
      .muted { color: #6b7280; }
      .status {
        text-align: center;
        padding: 60px 0;
        color: #6b7280;
      }
      button, select {
        border-radius: 8px;
        border: 1px solid #d5dbe7;
        padding: 8px 14px;
        background: #fff;
        font-size: 14px;
        cursor: pointer;
      }
      button.primary {
        background: #2563eb;
        border-color: #2563eb;
        color: #fff;
      }
      button.secondary:hover {
        border-color: #2563eb;
        color: #2563eb;
      }
      @media (max-width: 960px) {
        body { padding: 24px 16px; }
        th, td { padding: 12px 14px; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <header>
        <h1>心血管評估資料概覽</h1>
        <p>快速瀏覽最新評估紀錄、風險層級分佈與原始量測資料，支援醫師即時掌握病患狀況。</p>
      </header>

      <section class="controls">
        <div>
          顯示筆數：
          <select id="limit">
            <option value="10">10</option>
            <option value="20" selected>20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <button class="secondary" id="refresh">重新整理</button>
        </div>
        <div>
          <button class="secondary" id="filter-all">全部</button>
          <button class="secondary" data-level="extremely_high">極高</button>
          <button class="secondary" data-level="very_high">非常高</button>
          <button class="secondary" data-level="high">高</button>
          <button class="secondary" data-level="medium">中</button>
          <button class="secondary" data-level="low">低</button>
        </div>
      </section>

      <section class="stats" id="stats"></section>

      <section id="status" class="status">資料載入中...</section>

      <div id="table-wrapper" style="display:none;">
        <table>
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
          <tbody id="table-body"></tbody>
        </table>
      </div>
    </div>

    <script>
      const statusEl = document.getElementById('status');
      const statsEl = document.getElementById('stats');
      const tableWrapper = document.getElementById('table-wrapper');
      const tbody = document.getElementById('table-body');
      const limitEl = document.getElementById('limit');
      const filterButtons = document.querySelectorAll('[data-level]');
      let currentLevel = 'all';

      const LEVEL_LABELS = {
        extremely_high: '極高',
        very_high: '非常高',
        high: '高',
        medium: '中',
        low: '低',
        undefined: '未定義',
      };

      function chipClass(level) {
        return 'chip ' + (LEVEL_LABELS[level] ? level : 'undefined');
      }

      async function loadDashboard() {
        try {
          statusEl.style.display = 'block';
          statusEl.textContent = '資料載入中...';
          tableWrapper.style.display = 'none';

          const limit = Number(limitEl.value) || 20;
          const resp = await fetch(`/api/admin/assessments?limit=${limit}`);

          if (!resp.ok) {
            throw new Error(await resp.text());
          }

          const data = await resp.json();
          renderStats(data.stats);
          renderTable(data.assessments || []);
          statusEl.style.display = 'none';
          tableWrapper.style.display = 'block';
        } catch (err) {
          statusEl.textContent = '載入失敗：' + (err.message || '未知錯誤');
          tableWrapper.style.display = 'none';
        }
      }

      function renderStats(stats) {
        const tpl = (stats && stats.totalAssessments > 0)
          ? `
              <div class="card">
                <span>總評估次數</span>
                <strong>${stats.totalAssessments}</strong>
                <p class="muted">最新評估時間：${stats.latestAssessmentAt || '-'}</p>
              </div>
              <div class="card">
                <span>平均危險因子數</span>
                <strong>${stats.averageRiskFactorCount !== null ? stats.averageRiskFactorCount.toFixed(1) : '—'}</strong>
                <p class="muted">含所有風險層級</p>
              </div>
              <div class="card">
                <span>風險層級分佈</span>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px;">
                  ${Object.keys(LEVEL_LABELS)
                    .map(code => `<span class="tag">${LEVEL_LABELS[code]}：${stats.byLevel?.[code] ?? 0}</span>`)
                    .join('')}
                </div>
              </div>
            `
          : '<div class="card"><span>尚無資料</span><strong>—</strong><p class="muted">等待新評估紀錄</p></div>';
        statsEl.innerHTML = tpl;
      }

      function renderTable(records) {
        const filtered = currentLevel === 'all'
          ? records
          : records.filter(item => item.levelCode === currentLevel);

        if (filtered.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="muted">尚未有符合條件的評估紀錄。</td></tr>';
          return;
        }

        tbody.innerHTML = filtered.map(record => {
          const riskFactors = (record.riskFactors || [])
            .filter(item => item.present)
            .map(item => `<span class="tag">${item.label}</span>`)
            .join('');

          const matchedRules = (record.matchedRules || [])
            .map(rule => `<span class="tag">${rule.label}</span>`)
            .join('') || '—';

          const metabolicTags = Object.entries(record.metabolicSyndrome?.components || {})
            .filter(([, present]) => present)
            .map(([key]) => `<span class="tag">${key}</span>`)
            .join('');

          return `
            <tr>
              <td>${new Date(record.createdAt).toLocaleString()}</td>
              <td><span class="${chipClass(record.levelCode)}">${LEVEL_LABELS[record.levelCode] || record.level}</span></td>
              <td>
                <div><strong>${record.riskFactorCount} 項</strong></div>
                <div class="tags">${riskFactors}</div>
              </td>
              <td><div class="tags">${matchedRules}</div></td>
              <td>
                <div><strong>${record.metabolicSyndrome?.count ?? 0} / 5</strong></div>
                <div class="tags">${metabolicTags}</div>
              </td>
              <td>
                <details>
                  <summary>檢視 JSON</summary>
                  <pre class="payload">${JSON.stringify(record.payload ?? {}, null, 2)}</pre>
                </details>
              </td>
            </tr>
          `;
        }).join('');
      }

      document.getElementById('refresh').addEventListener('click', loadDashboard);
      limitEl.addEventListener('change', loadDashboard);
      document.getElementById('filter-all').addEventListener('click', () => {
        currentLevel = 'all';
        loadDashboard();
      });
      filterButtons.forEach(button => {
        button.addEventListener('click', () => {
          currentLevel = button.dataset.level;
          loadDashboard();
        });
      });

      loadDashboard();
    </script>
  </body>
</html>
"""


@router.get(
    "/admin/dashboard",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def serve_admin_dashboard() -> HTMLResponse:
    """提供快速預覽用的靜態儀表板頁面。"""

    return HTMLResponse(content=DASHBOARD_HTML)
