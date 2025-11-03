"""風險評估 API 與後台資料檢視路由。"""

from fastapi import APIRouter, Depends, Query, status
from fastapi.responses import HTMLResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.db.session import get_session
from app.models import AdminAccount, Assessment, AssessmentFactor
from app.repositories import AssessmentRepository
from app.schemas import (
    AssessmentListResponse,
    AssessmentRecord,
    AssessmentStats,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskLevelCodeEnum,
)
from app.services import (
    RiskAssessmentServiceProtocol,
    get_risk_assessment_service,
)

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
    _current_admin: AdminAccount = Depends(get_current_admin),
) -> AssessmentListResponse:
    """提供醫療儀表板使用的評估資料列表與統計。"""

    repository = AssessmentRepository(session)
    assessments = repository.list_recent_assessments(limit=limit)

    records: list[AssessmentRecord] = []

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

    total_count = session.scalar(select(func.count()).select_from(Assessment)) or 0
    average_risk_factor = session.scalar(
        select(func.avg(Assessment.risk_factor_count))
    )
    level_rows = session.execute(
        select(Assessment.level_code, func.count())
        .group_by(Assessment.level_code)
    ).all()
    global_by_level = {
        (code if code is not None else RiskLevelCodeEnum.UNDEFINED.value): count
        for code, count in level_rows
    }

    stats = AssessmentStats(
        totalAssessments=total_count,
        byLevel={
            level: global_by_level.get(level.value, 0)
            for level in RiskLevelCodeEnum
        },
        averageRiskFactorCount=(
            float(average_risk_factor) if average_risk_factor is not None else None
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
      .auth-meta {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 14px;
        color: #4b5563;
      }
      .auth-meta strong {
        color: #1f2937;
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
        background: rgba(148, 163, 184, 0.18);
        border-radius: 999px;
        padding: 4px 10px;
        font-size: 11px;
        color: #0f172a;
      }
      .muted {
        color: #6c7280;
      }
      pre.payload {
        max-height: 240px;
        overflow: auto;
        background: #0f172a;
        color: #e2e8f0;
        padding: 16px;
        border-radius: 12px;
      }
      .filter-buttons {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
      button {
        border: none;
        background: #2563eb;
        color: #fff;
        padding: 10px 16px;
        border-radius: 999px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      button.secondary {
        background: rgba(37, 99, 235, 0.08);
        color: #1d4ed8;
      }
      button:hover {
        transform: translateY(-1px);
        box-shadow: 0 10px 20px rgba(37, 99, 235, 0.25);
      }
      select {
        border-radius: 999px;
        padding: 9px 16px;
        border: 1px solid rgba(148, 163, 184, 0.6);
        font-size: 14px;
        min-width: 140px;
      }
      .auth-overlay {
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.55);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
      }
      .auth-card {
        background: #fff;
        padding: 32px;
        border-radius: 20px;
        width: min(420px, 92%);
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.3);
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .auth-card h2 {
        margin: 0;
      }
      label {
        font-size: 13px;
        color: #475569;
        margin-bottom: 6px;
        display: block;
      }
      input {
        width: 100%;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid rgba(148, 163, 184, 0.6);
        font-size: 14px;
      }
      .auth-card button {
        width: 100%;
        justify-content: center;
      }
      .helper {
        font-size: 13px;
        color: #6b7280;
        margin: 0;
      }
      .alert {
        padding: 12px 14px;
        border-radius: 12px;
        background: rgba(248, 113, 113, 0.12);
        color: #b91c1c;
        font-size: 13px;
      }
      .hidden {
        display: none !important;
      }
    </style>
  </head>
  <body>
    <div class="auth-overlay hidden" id="auth-overlay">
      <div class="auth-card">
        <div>
          <h2>管理者登入</h2>
          <p class="helper">登入後才可載入儀表板資料，帳號資訊請向系統管理者索取。</p>
        </div>
        <form id="login-form">
          <div>
            <label for="login-email">電子郵件</label>
            <input id="login-email" type="email" required />
          </div>
          <div>
            <label for="login-password">密碼</label>
            <input id="login-password" type="password" required minlength="8" />
          </div>
          <button type="submit">登入儀表板</button>
        </form>
        <div class="alert hidden" id="login-error"></div>
      </div>
    </div>
    <div class="container">
      <header>
        <h1>心血管評估資料儀表板</h1>
        <p>快速檢視最新的問卷紀錄與風險分布概況。</p>
        <div class="auth-meta" id="auth-meta">
          <span class="muted">尚未登入</span>
        </div>
      </header>
      <section class="controls">
        <div style="display:flex; gap: 12px; align-items: center;">
          <label class="muted" for="limit">顯示筆數：</label>
          <select id="limit">
            <option value="20">20</option>
            <option value="50" selected>50</option>
            <option value="100">100</option>
          </select>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" id="refresh">重新整理</button>
          <button type="button" class="secondary" id="logout-btn">登出帳號</button>
        </div>
      </section>

      <section class="stats" id="stats"></section>

      <section class="controls" style="margin-bottom: 12px;">
        <div class="filter-buttons">
          <button class="secondary" id="filter-all">全部</button>
          <button class="secondary" data-level="extremely_high">極高</button>
          <button class="secondary" data-level="very_high">非常高</button>
          <button class="secondary" data-level="high">高</button>
          <button class="secondary" data-level="medium">中</button>
          <button class="secondary" data-level="low">低</button>
        </div>
      </section>

      <section id="status" class="muted">資料載入中...</section>

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
      const tokenStorageKey = 'adminDashboardToken';
      let accessToken = localStorage.getItem(tokenStorageKey) ?? '';
      let currentAdmin = null;
      let currentLevel = 'all';

      const statusEl = document.getElementById('status');
      const statsEl = document.getElementById('stats');
      const tableWrapper = document.getElementById('table-wrapper');
      const tbody = document.getElementById('table-body');
      const limitEl = document.getElementById('limit');
      const filterButtons = document.querySelectorAll('[data-level]');
      const overlay = document.getElementById('auth-overlay');
      const loginForm = document.getElementById('login-form');
      const loginError = document.getElementById('login-error');
      const logoutBtn = document.getElementById('logout-btn');

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

      function updateAuthMeta(admin) {
        const metaEl = document.getElementById('auth-meta');
        if (!admin) {
          metaEl.innerHTML = '<span class="muted">尚未登入</span>';
          logoutBtn.classList.add('hidden');
          return;
        }
        const lastLogin = admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : '—';
        metaEl.innerHTML = `
          <strong>${admin.email}</strong>
          <span class="muted">上一個登入時間：${lastLogin}</span>
        `;
        logoutBtn.classList.remove('hidden');
      }

      function showLogin(message) {
        if (message) {
          loginError.textContent = message;
          loginError.classList.remove('hidden');
        } else {
          loginError.classList.add('hidden');
        }
        overlay.classList.remove('hidden');
      }

      function hideLogin() {
        overlay.classList.add('hidden');
        loginError.classList.add('hidden');
      }

      async function fetchWithAuth(url, options = {}) {
        if (!accessToken) {
          throw new Error('missing_token');
        }
        const headers = new Headers(options.headers || {});
        headers.set('Authorization', `Bearer ${accessToken}`);
        headers.set('Accept', 'application/json');
        return fetch(url, { ...options, headers });
      }

      function renderStats(stats) {
        if (!stats || !stats.totalAssessments) {
          statsEl.innerHTML = '<div class="card"><span>尚無資料</span><strong>—</strong><p class="muted">等待新評估紀錄</p></div>';
          return;
        }
        statsEl.innerHTML = `
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
            <div class="tags">
              ${Object.keys(LEVEL_LABELS)
                .map(code => `<span class="tag">${LEVEL_LABELS[code]}：${stats.byLevel?.[code] ?? 0}</span>`)
                .join('')}
            </div>
          </div>
        `;
      }

      function renderTable(records) {
        const filtered = currentLevel === 'all'
          ? records
          : records.filter(item => item.levelCode === currentLevel);

        if (!filtered.length) {
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
            .map(([key]) => {
              switch (key) {
                case 'abdominalObesity':
                  return '<span class="tag">腹部肥胖</span>';
                case 'elevatedBloodPressure':
                  return '<span class="tag">血壓偏高或治療中</span>';
                case 'elevatedGlucose':
                  return '<span class="tag">空腹血糖偏高或使用降糖藥</span>';
                case 'elevatedTriglyceride':
                  return '<span class="tag">三酸甘油酯偏高或治療中</span>';
                case 'lowHdl':
                  return '<span class="tag">HDL-C 偏低</span>';
                default:
                  return `<span class="tag">${key}</span>`;
              }
            })
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
                <div class="tags">${metabolicTags || '—'}</div>
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

      async function loadDashboard() {
        if (!accessToken) {
          showLogin();
          return;
        }
        statusEl.textContent = '資料載入中...';
        statusEl.classList.remove('hidden');
        tableWrapper.style.display = 'none';

        try {
          const response = await fetchWithAuth(`/api/admin/assessments?limit=${limitEl.value}`);
          if (response.status === 401) {
            throw new Error('unauthorized');
          }
          const data = await response.json();
          renderStats(data.stats);
          renderTable(data.assessments || []);
          statusEl.classList.add('hidden');
          tableWrapper.style.display = 'block';
        } catch (error) {
          if (error.message === 'unauthorized') {
            accessToken = '';
            currentAdmin = null;
            localStorage.removeItem(tokenStorageKey);
            updateAuthMeta(null);
            showLogin('登入已失效，請重新登入。');
            return;
          }
          statusEl.textContent = '載入失敗，請稍後再試。';
          statusEl.classList.remove('hidden');
        }
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

      loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = '登入中...';
        loginError.classList.add('hidden');

        try {
          const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.detail || '登入失敗，請確認帳號密碼。');
          }

          const result = await response.json();
          accessToken = result.accessToken;
          currentAdmin = result.admin;
          localStorage.setItem(tokenStorageKey, accessToken);
          updateAuthMeta(currentAdmin);
          hideLogin();
          await loadDashboard();
        } catch (error) {
          loginError.textContent = error.message || '登入失敗，請稍後再試。';
          loginError.classList.remove('hidden');
        } finally {
          submitBtn.disabled = false;
          submitBtn.textContent = '登入儀表板';
        }
      });

      logoutBtn.addEventListener('click', () => {
        accessToken = '';
        currentAdmin = null;
        localStorage.removeItem(tokenStorageKey);
        updateAuthMeta(null);
        showLogin('已登出。');
      });

      async function bootstrap() {
        if (!accessToken) {
          showLogin();
          return;
        }
        try {
          const response = await fetchWithAuth('/api/admin/me');
          if (!response.ok) {
            throw new Error('unauthorized');
          }
          currentAdmin = await response.json();
          updateAuthMeta(currentAdmin);
          hideLogin();
          await loadDashboard();
        } catch (error) {
          accessToken = '';
          currentAdmin = null;
          localStorage.removeItem(tokenStorageKey);
          updateAuthMeta(null);
          showLogin('登入已失效，請重新登入。');
        }
      }

      bootstrap();
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
