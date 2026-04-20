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
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#f8fafb;--surface:#ffffff;--border:#e2e8f0;
  --text-primary:#1a2332;--text-secondary:#5a6577;--text-muted:#8892a4;
  --accent:#2563eb;--accent-light:rgba(37,99,235,0.08);
  --red:#dc2626;--red-bg:rgba(220,38,38,0.08);
  --orange:#ea580c;--orange-bg:rgba(234,88,12,0.08);
  --amber:#d97706;--amber-bg:rgba(217,119,6,0.08);
  --blue:#2563eb;--blue-bg:rgba(37,99,235,0.08);
  --green:#059669;--green-bg:rgba(5,150,105,0.08);
  --gray:#6b7280;--gray-bg:rgba(107,114,128,0.08);
}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:var(--bg);color:var(--text-primary);font-size:13px;line-height:1.5}

/* ---------- header ---------- */
.header{background:var(--surface);border-bottom:1px solid var(--border);padding:0 32px}
.header-top{max-width:1120px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;height:56px}
.header-title{display:flex;align-items:center;gap:10px;font-size:20px;font-weight:600;color:var(--text-primary)}
.header-title .icon{color:var(--red);font-size:22px}
.header-right{display:flex;align-items:center;gap:12px}
.avatar{width:30px;height:30px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}
.logout-btn{background:none;border:1px solid var(--border);color:var(--text-secondary);padding:5px 12px;border-radius:8px;font-size:12px;font-weight:500;cursor:pointer;transition:background .15s}
.logout-btn:hover{background:var(--bg)}

/* ---------- tabs ---------- */
.tabs{max-width:1120px;margin:0 auto;display:flex;gap:4px;padding-top:4px}
.tab{background:none;border:none;padding:10px 18px;font-size:13px;font-weight:500;color:var(--text-muted);cursor:pointer;border-bottom:2px solid transparent;transition:color .15s,border-color .15s}
.tab:hover{color:var(--text-secondary)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent);font-weight:600}

/* ---------- main ---------- */
.main{max-width:1120px;margin:24px auto;padding:0 32px}
.tab-content{display:none}
.tab-content.active{display:block}

/* ---------- stat cards ---------- */
.stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px}
.stat-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px;display:flex;flex-direction:column;gap:6px}
.stat-card .label{font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted)}
.stat-card .value{font-size:28px;font-weight:700;color:var(--text-primary);line-height:1.1}
.stat-card .meta{font-size:12px;color:var(--text-muted)}
.sparkline{display:flex;align-items:flex-end;gap:3px;height:32px;margin-top:auto}
.sparkline .bar{width:6px;border-radius:3px;background:var(--accent-light);min-height:3px}

/* ---------- distribution ---------- */
.dist-section{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:20px}
.dist-section h3{font-size:14px;font-weight:600;margin-bottom:14px}
.dist-bar{display:flex;height:28px;border-radius:6px;overflow:hidden;margin-bottom:12px}
.dist-bar>div{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;color:#fff;transition:width .4s}
.dist-legend{display:flex;flex-wrap:wrap;gap:14px}
.dist-legend span{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary)}
.dist-legend span::before{content:'';width:10px;height:10px;border-radius:3px;display:inline-block}

/* ---------- filter row ---------- */
.filter-row{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:16px}
.filter-chips{display:flex;gap:6px;flex-wrap:wrap}
.filter-chip{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:5px 14px;font-size:12px;font-weight:500;color:var(--text-secondary);cursor:pointer;transition:all .15s}
.filter-chip:hover{border-color:var(--accent);color:var(--accent)}
.filter-chip.active{background:var(--accent);border-color:var(--accent);color:#fff}
.controls-right{display:flex;align-items:center;gap:10px}
.controls-right select{border:1px solid var(--border);border-radius:8px;padding:6px 12px;font-size:13px;color:var(--text-primary);background:var(--surface);cursor:pointer}
.btn-action{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:6px 14px;font-size:13px;font-weight:500;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:opacity .15s}
.btn-action:hover{opacity:.85}

/* ---------- table ---------- */
.table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:hidden}
table{width:100%;border-collapse:collapse}
thead{background:var(--bg)}
th{padding:10px 16px;font-size:12px;font-weight:500;text-transform:uppercase;letter-spacing:.04em;color:var(--text-muted);text-align:left;border-bottom:1px solid var(--border)}
td{padding:12px 16px;font-size:13px;vertical-align:top;border-bottom:1px solid var(--border);color:var(--text-primary)}
tbody tr:last-child td{border-bottom:none}
tbody tr:hover{background:var(--bg)}

/* ---------- chips & tags ---------- */
.chip{display:inline-flex;align-items:center;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:600;white-space:nowrap}
.chip.extremely_high{background:var(--red-bg);color:var(--red)}
.chip.very_high{background:var(--orange-bg);color:var(--orange)}
.chip.high{background:var(--amber-bg);color:var(--amber)}
.chip.medium{background:var(--blue-bg);color:var(--blue)}
.chip.low{background:var(--green-bg);color:var(--green)}
.chip.undefined{background:var(--gray-bg);color:var(--gray)}
.tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}
.tag{background:var(--bg);border:1px solid var(--border);border-radius:4px;padding:2px 8px;font-size:11px;color:var(--text-secondary)}
.td-meta{font-size:12px;color:var(--text-muted)}
pre.payload{max-height:240px;overflow:auto;background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;font-size:12px;margin-top:6px}

/* ---------- auth overlay ---------- */
.auth-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.55);display:flex;align-items:center;justify-content:center;z-index:100}
.auth-card{background:var(--surface);padding:32px;border-radius:12px;width:min(400px,92%);box-shadow:0 20px 50px rgba(15,23,42,0.25);display:flex;flex-direction:column;gap:20px}
.auth-card h2{font-size:20px;font-weight:600}
.auth-card p{font-size:13px;color:var(--text-muted);margin-top:4px}
.auth-card label{font-size:12px;font-weight:500;color:var(--text-secondary);display:block;margin-bottom:6px}
.auth-card input{width:100%;padding:9px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;transition:border-color .15s}
.auth-card input:focus{outline:none;border-color:var(--accent)}
.auth-card .field{margin-bottom:14px}
.auth-card button[type=submit]{width:100%;padding:10px;background:var(--accent);color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s}
.auth-card button[type=submit]:hover{opacity:.9}
.alert{padding:10px 14px;border-radius:8px;background:var(--red-bg);color:var(--red);font-size:13px}
.hidden{display:none !important}
.status-msg{font-size:13px;color:var(--text-muted);padding:20px 0}

/* ---------- responsive ---------- */
@media(max-width:900px){.stats-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:600px){.stats-grid{grid-template-columns:1fr}.header{padding:0 16px}.main{padding:0 16px}}
</style>
</head>
<body>

<!-- auth overlay -->
<div class="auth-overlay hidden" id="auth-overlay">
  <div class="auth-card">
    <div>
      <h2>管理者登入</h2>
      <p>登入後才可載入儀表板資料，帳號資訊請向系統管理者索取。</p>
    </div>
    <form id="login-form">
      <div class="field">
        <label for="login-email">電子郵件</label>
        <input id="login-email" type="email" required placeholder="admin@example.com" />
      </div>
      <div class="field">
        <label for="login-password">密碼</label>
        <input id="login-password" type="password" required minlength="8" />
      </div>
      <button type="submit">登入儀表板</button>
    </form>
    <div class="alert hidden" id="login-error"></div>
  </div>
</div>

<!-- header -->
<div class="header">
  <div class="header-top">
    <div class="header-title"><span class="icon">\u2665</span>心血管評估儀表板</div>
    <div class="header-right" id="auth-meta"></div>
  </div>
  <div class="tabs">
    <button class="tab active" data-tab="tab-overview">概覽</button>
    <button class="tab" data-tab="tab-records">評估紀錄</button>
  </div>
</div>

<!-- main -->
<div class="main">

  <!-- overview tab -->
  <div class="tab-content active" id="tab-overview">
    <div class="stats-grid" id="stats-grid"></div>
    <div class="dist-section" id="dist-section">
      <h3>風險層級分佈</h3>
      <div class="dist-bar" id="dist-bar"></div>
      <div class="dist-legend" id="dist-legend"></div>
    </div>
  </div>

  <!-- records tab -->
  <div class="tab-content" id="tab-records">
    <div class="filter-row">
      <div class="filter-chips" id="filter-chips">
        <span class="filter-chip active" data-level="all">全部</span>
        <span class="filter-chip" data-level="extremely_high">極高</span>
        <span class="filter-chip" data-level="very_high">非常高</span>
        <span class="filter-chip" data-level="high">高</span>
        <span class="filter-chip" data-level="medium">中</span>
        <span class="filter-chip" data-level="low">低</span>
      </div>
      <div class="controls-right">
        <select id="limit">
          <option value="20">20 筆</option>
          <option value="50" selected>50 筆</option>
          <option value="100">100 筆</option>
          <option value="200">200 筆</option>
        </select>
        <button class="btn-action" id="refresh" type="button">\u21BB 重新整理</button>
      </div>
    </div>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>建立時間</th>
            <th>風險層級</th>
            <th>危險因子</th>
            <th>命中規則</th>
            <th>代謝症候群</th>
            <th>原始資料</th>
          </tr>
        </thead>
        <tbody id="table-body"></tbody>
      </table>
    </div>
  </div>

  <div class="status-msg" id="status">資料載入中...</div>
</div>

<script>
var TOKEN_KEY = 'adminDashboardToken';
var accessToken = localStorage.getItem(TOKEN_KEY) || '';
var currentAdmin = null;
var cachedData = null;

var LEVEL_LABELS = {
  extremely_high: '極高',
  very_high: '非常高',
  high: '高',
  medium: '中',
  low: '低',
  undefined: '未定義'
};

var LEVEL_COLORS = {
  extremely_high: 'var(--red)',
  very_high: 'var(--orange)',
  high: 'var(--amber)',
  medium: 'var(--blue)',
  low: 'var(--green)',
  undefined: 'var(--gray)'
};

var METABOLIC_LABELS = {
  abdominalObesity: '腹部肥胖',
  elevatedBloodPressure: '血壓偏高或治療中',
  elevatedGlucose: '空腹血糖偏高或使用降糖藥',
  elevatedTriglyceride: '三酸甘油酯偏高或治療中',
  lowHdl: 'HDL-C 偏低'
};

/* ---- auth helpers ---- */
function updateAuthMeta(admin) {
  var el = document.getElementById('auth-meta');
  if (!admin) {
    el.innerHTML = '';
    return;
  }
  var lastLogin = admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString() : '—';
  el.innerHTML =
    '<div class="avatar">' + admin.email.charAt(0).toUpperCase() + '</div>' +
    '<div style="font-size:12px;line-height:1.4">' +
      '<div style="font-weight:600;color:var(--text-primary)">' + admin.email + '</div>' +
      '<div style="color:var(--text-muted)">上次登入 ' + lastLogin + '</div>' +
    '</div>' +
    '<button class="logout-btn" id="logout-btn" type="button">登出</button>';
  document.getElementById('logout-btn').addEventListener('click', doLogout);
}

function showLogin(message) {
  var errEl = document.getElementById('login-error');
  if (message) {
    errEl.textContent = message;
    errEl.classList.remove('hidden');
  } else {
    errEl.classList.add('hidden');
  }
  document.getElementById('auth-overlay').classList.remove('hidden');
}

function hideLogin() {
  document.getElementById('auth-overlay').classList.add('hidden');
  document.getElementById('login-error').classList.add('hidden');
}

function doLogout() {
  accessToken = '';
  currentAdmin = null;
  cachedData = null;
  localStorage.removeItem(TOKEN_KEY);
  updateAuthMeta(null);
  showLogin('已登出。');
}

/* ---- fetch wrapper ---- */
function fetchWithAuth(url, options) {
  options = options || {};
  if (!accessToken) throw new Error('missing_token');
  var headers = new Headers(options.headers || {});
  headers.set('Authorization', 'Bearer ' + accessToken);
  headers.set('Accept', 'application/json');
  return fetch(url, Object.assign({}, options, { headers: headers }));
}

/* ---- sparkline helper ---- */
function sparklineHTML(heights, color) {
  var html = '<div class="sparkline">';
  for (var i = 0; i < heights.length; i++) {
    html += '<div class="bar" style="height:' + heights[i] + '%;background:' + (color || 'var(--accent-light)') + '"></div>';
  }
  html += '</div>';
  return html;
}

/* ---- render stats ---- */
function renderStats(stats) {
  var grid = document.getElementById('stats-grid');
  var distBar = document.getElementById('dist-bar');
  var distLegend = document.getElementById('dist-legend');

  if (!stats || !stats.totalAssessments) {
    grid.innerHTML = '<div class="stat-card"><div class="label">尚無資料</div><div class="value">—</div><div class="meta">等待新評估紀錄</div></div>';
    distBar.innerHTML = '';
    distLegend.innerHTML = '';
    return;
  }

  var total = stats.totalAssessments;
  var avg = stats.averageRiskFactorCount !== null && stats.averageRiskFactorCount !== undefined
    ? stats.averageRiskFactorCount.toFixed(1) : '—';

  var highCount = (stats.byLevel.extremely_high || 0) + (stats.byLevel.very_high || 0) + (stats.byLevel.high || 0);
  var highPct = total > 0 ? ((highCount / total) * 100).toFixed(1) : '0';

  var latestDate = stats.latestAssessmentAt
    ? new Date(stats.latestAssessmentAt).toLocaleDateString()
    : '—';
  var latestTime = stats.latestAssessmentAt
    ? new Date(stats.latestAssessmentAt).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})
    : '';

  grid.innerHTML =
    '<div class="stat-card">' +
      '<div class="label">總評估次數</div>' +
      '<div class="value">' + total + '</div>' +
      sparklineHTML([30,50,40,70,55,80,65], 'var(--accent-light)') +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="label">平均危險因子</div>' +
      '<div class="value">' + avg + '</div>' +
      sparklineHTML([40,35,60,45,70,50,55], 'var(--accent-light)') +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="label">高風險佔比</div>' +
      '<div class="value">' + highPct + '%</div>' +
      sparklineHTML([60,75,50,80,65,70,55], 'var(--red-bg)') +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="label">最新評估</div>' +
      '<div class="value">' + latestDate + '</div>' +
      '<div class="meta">' + latestTime + '</div>' +
    '</div>';

  /* distribution bar */
  var order = ['extremely_high','very_high','high','medium','low','undefined'];
  var colors = {extremely_high:'var(--red)',very_high:'var(--orange)',high:'var(--amber)',medium:'var(--blue)',low:'var(--green)',undefined:'var(--gray)'};
  var barHTML = '';
  var legendHTML = '';
  for (var i = 0; i < order.length; i++) {
    var code = order[i];
    var count = stats.byLevel[code] || 0;
    if (count === 0) continue;
    var pct = (count / total) * 100;
    var showLabel = pct >= 4;
    barHTML += '<div style="width:' + pct.toFixed(2) + '%;background:' + colors[code] + '">' + (showLabel ? count : '') + '</div>';
    legendHTML += '<span style="--dot:' + colors[code] + '"><i style="background:' + colors[code] + ';width:10px;height:10px;border-radius:3px;display:inline-block"></i> ' + LEVEL_LABELS[code] + ' ' + count + '</span>';
  }
  distBar.innerHTML = barHTML;
  distLegend.innerHTML = legendHTML;
}

/* ---- render table ---- */
function renderTable(records) {
  var activeChip = document.querySelector('.filter-chip.active');
  var currentLevel = activeChip ? activeChip.getAttribute('data-level') : 'all';
  var filtered = currentLevel === 'all'
    ? records
    : records.filter(function(r) { return r.levelCode === currentLevel; });

  var tbody = document.getElementById('table-body');

  if (!filtered.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="color:var(--text-muted);text-align:center;padding:32px">尚未有符合條件的評估紀錄。</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(record) {
    var dt = new Date(record.createdAt);
    var dateStr = dt.toLocaleDateString();
    var timeStr = dt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

    var riskFactors = (record.riskFactors || [])
      .filter(function(f) { return f.present; })
      .map(function(f) { return '<span class="tag">' + f.label + '</span>'; })
      .join('');

    var matchedRules = (record.matchedRules || [])
      .map(function(r) { return '<span class="tag">' + r.label + '</span>'; })
      .join('') || '—';

    var metabolicTags = Object.keys(record.metabolicSyndrome && record.metabolicSyndrome.components ? record.metabolicSyndrome.components : {})
      .filter(function(k) { return record.metabolicSyndrome.components[k]; })
      .map(function(k) { return '<span class="tag">' + (METABOLIC_LABELS[k] || k) + '</span>'; })
      .join('');

    var chipCls = 'chip ' + (LEVEL_LABELS[record.levelCode] ? record.levelCode : 'undefined');

    return '<tr>' +
      '<td><div>' + dateStr + '</div><div class="td-meta">' + timeStr + '</div></td>' +
      '<td><span class="' + chipCls + '">' + (LEVEL_LABELS[record.levelCode] || record.level) + '</span></td>' +
      '<td><div><strong>' + record.riskFactorCount + ' 項</strong></div><div class="tags">' + riskFactors + '</div></td>' +
      '<td><div class="tags">' + matchedRules + '</div></td>' +
      '<td><div><strong>' + (record.metabolicSyndrome ? record.metabolicSyndrome.count : 0) + ' / 5</strong></div><div class="tags">' + (metabolicTags || '—') + '</div></td>' +
      '<td><details><summary style="cursor:pointer;font-size:12px;color:var(--accent)">檢視 JSON</summary><pre class="payload">' + JSON.stringify(record.payload || {}, null, 2) + '</pre></details></td>' +
    '</tr>';
  }).join('');
}

/* ---- load data ---- */
function loadDashboard() {
  if (!accessToken) { showLogin(); return; }
  var statusEl = document.getElementById('status');
  statusEl.textContent = '資料載入中...';
  statusEl.classList.remove('hidden');

  var limitVal = document.getElementById('limit').value;
  fetchWithAuth('/api/admin/assessments?limit=' + limitVal)
    .then(function(res) {
      if (res.status === 401) throw new Error('unauthorized');
      return res.json();
    })
    .then(function(data) {
      cachedData = data;
      renderStats(data.stats);
      renderTable(data.assessments || []);
      statusEl.classList.add('hidden');
    })
    .catch(function(err) {
      if (err.message === 'unauthorized') {
        accessToken = '';
        currentAdmin = null;
        localStorage.removeItem(TOKEN_KEY);
        updateAuthMeta(null);
        showLogin('登入已失效，請重新登入。');
        return;
      }
      statusEl.textContent = '載入失敗，請稍後再試。';
      statusEl.classList.remove('hidden');
    });
}

/* ---- bootstrap ---- */
function bootstrap() {
  if (!accessToken) { showLogin(); return; }
  fetchWithAuth('/api/admin/me')
    .then(function(res) {
      if (!res.ok) throw new Error('unauthorized');
      return res.json();
    })
    .then(function(admin) {
      currentAdmin = admin;
      updateAuthMeta(currentAdmin);
      hideLogin();
      loadDashboard();
    })
    .catch(function() {
      accessToken = '';
      currentAdmin = null;
      localStorage.removeItem(TOKEN_KEY);
      updateAuthMeta(null);
      showLogin('登入已失效，請重新登入。');
    });
}

/* ---- event listeners ---- */

/* refresh & limit */
document.getElementById('refresh').addEventListener('click', loadDashboard);
document.getElementById('limit').addEventListener('change', loadDashboard);

/* tab switching */
document.querySelector('.tabs').addEventListener('click', function(e) {
  var btn = e.target.closest('.tab');
  if (!btn) return;
  document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  document.querySelectorAll('.tab-content').forEach(function(p) { p.classList.remove('active'); });
  var panel = document.getElementById(btn.getAttribute('data-tab'));
  if (panel) panel.classList.add('active');
});

/* filter chips (event delegation) */
document.getElementById('filter-chips').addEventListener('click', function(e) {
  var chip = e.target.closest('.filter-chip');
  if (!chip) return;
  document.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
  chip.classList.add('active');
  if (cachedData) renderTable(cachedData.assessments || []);
});

/* login form */
document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  var email = document.getElementById('login-email').value;
  var password = document.getElementById('login-password').value;
  var submitBtn = e.target.querySelector('button[type=submit]');
  submitBtn.disabled = true;
  submitBtn.textContent = '登入中...';
  document.getElementById('login-error').classList.add('hidden');

  fetch('/api/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ email: email, password: password })
  })
  .then(function(res) {
    if (!res.ok) return res.json().catch(function() { return {}; }).then(function(p) { throw new Error(p.detail || '登入失敗，請確認帳號密碼。'); });
    return res.json();
  })
  .then(function(result) {
    accessToken = result.accessToken;
    currentAdmin = result.admin;
    localStorage.setItem(TOKEN_KEY, accessToken);
    updateAuthMeta(currentAdmin);
    hideLogin();
    loadDashboard();
  })
  .catch(function(err) {
    document.getElementById('login-error').textContent = err.message || '登入失敗，請稍後再試。';
    document.getElementById('login-error').classList.remove('hidden');
  })
  .finally(function() {
    submitBtn.disabled = false;
    submitBtn.textContent = '登入儀表板';
  });
});

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
