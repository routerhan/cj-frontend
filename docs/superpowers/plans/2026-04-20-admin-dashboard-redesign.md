# Admin Dashboard Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the admin dashboard UI with a professional medical-grade design featuring tab navigation, stat cards with sparklines, a stacked distribution bar, and an optimized data table.

**Architecture:** Single-file replacement of the `DASHBOARD_HTML` string in `backend/app/api/risk_assessment.py`. No API, schema, or backend logic changes. All HTML, CSS, and JavaScript is self-contained in the string literal.

**Tech Stack:** Vanilla HTML/CSS/JavaScript (no external dependencies). Python string in FastAPI.

---

### File Map

- **Modify:** `backend/app/api/risk_assessment.py:110-689` — Replace `DASHBOARD_HTML` string

No new files. No test files (this is a visual-only change to an embedded HTML string; verification is manual).

---

### Task 1: Replace CSS design system

**Files:**
- Modify: `backend/app/api/risk_assessment.py:110-689`

Replace the `<style>` block inside `DASHBOARD_HTML` with the new design system. This covers CSS custom properties, all component styles, and interactive states.

- [ ] **Step 1: Replace the `DASHBOARD_HTML` opening through end of `</style>`**

Replace from `DASHBOARD_HTML = """` through the closing `</style>` tag (lines 110–329 of current file) with the new CSS. Keep the `<!DOCTYPE html>`, `<head>`, and `<meta>` tags. The new CSS defines:

- CSS custom properties for the full color palette (background, surface, border, text tiers, accent, 6 risk-level colors with bg variants)
- Reset (`* { margin:0; padding:0; box-sizing:border-box; }`)
- Body: font-family stack, background, color, line-height
- `.header`: white background, bottom border, padding `20px 32px 0`
- `.header-top`: flex row, space-between, center aligned, bottom margin 16px
- `.header-title`: flex row with `.icon` (36px blue square, rounded 10px, white heart symbol) + title/subtitle
- `.header-right`: flex row with `.avatar` (32px circle), email, logout button
- `.tabs`: flex row, `.tab` items with 2px bottom border (transparent default, accent when `.active`)
- `.main`: padding `24px 32px`, max-width 1200px, centered
- `.tab-content`: `display:none`, `.tab-content.active`: `display:block`
- `.stats-grid`: 4-column CSS grid, gap 16px
- `.stat-card`: white, 1px border, border-radius 12px, padding 20px. Contains `.label` (12px uppercase muted), `.value` (28px bold), `.sub` (12px muted), `.sparkline` (flex, align-end, 32px height, `.bar` children)
- `.dist-section`: white card with `.dist-bar` (flex, 36px height, rounded 8px, overflow hidden) + `.dist-legend` (flex wrap, dot+label items)
- `.filter-row`: flex, space-between. `.filter-chips` flex with `.filter-chip` (pill shape, border, `.active` gets accent bg)
- `.table-wrap`: white card, overflow hidden. `table` full width collapse. `thead` #f8fafc bg. `th` 12px uppercase. `td` 13px, 14px padding. `tbody tr:hover` #fafbfc
- `.chip`: inline-flex, border-radius 6px, 12px bold. Level variants: `.extremely_high`, `.very_high`, `.high`, `.medium`, `.low`, `.undefined`
- `.tag`: inline-block, 11px, #f1f5f9 bg, rounded 4px
- `.auth-overlay`: fixed fullscreen, centered `.auth-card` (white, rounded 20px, shadow, 420px max-width, 32px padding). Inputs rounded 8px. Submit button full-width accent.
- `.hidden`: `display:none!important`

```css
:root {
  --bg: #f8fafb;
  --surface: #ffffff;
  --border: #e2e8f0;
  --text-primary: #1a2332;
  --text-secondary: #5a6577;
  --text-muted: #8892a4;
  --accent: #2563eb;
  --accent-light: rgba(37,99,235,0.08);
  --red: #dc2626; --red-bg: rgba(220,38,38,0.08);
  --orange: #ea580c; --orange-bg: rgba(234,88,12,0.08);
  --amber: #d97706; --amber-bg: rgba(217,119,6,0.08);
  --blue: #2563eb; --blue-bg: rgba(37,99,235,0.08);
  --green: #059669; --green-bg: rgba(5,150,105,0.08);
  --gray: #6b7280; --gray-bg: rgba(107,114,128,0.08);
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg); color: var(--text-primary); line-height: 1.5;
}
.header {
  background: var(--surface); border-bottom: 1px solid var(--border);
  padding: 20px 32px 0;
}
.header-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px;
}
.header-title { display: flex; align-items: center; gap: 10px; }
.header-title .icon {
  width: 36px; height: 36px; background: var(--accent);
  border-radius: 10px; display: flex; align-items: center;
  justify-content: center; color: #fff; font-size: 18px;
}
.header-title h1 { font-size: 20px; font-weight: 600; }
.header-title p { font-size: 13px; color: var(--text-muted); margin: 0; }
.header-right {
  display: flex; align-items: center; gap: 16px;
  font-size: 13px; color: var(--text-secondary);
}
.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--accent-light); color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 13px;
}
.logout-btn {
  border: 1px solid var(--border); background: var(--surface);
  padding: 6px 14px; border-radius: 8px; font-size: 13px;
  color: var(--text-secondary); cursor: pointer;
}
.logout-btn:hover { background: #f1f5f9; }
.tabs { display: flex; gap: 0; }
.tab {
  padding: 10px 20px; font-size: 14px; font-weight: 500;
  color: var(--text-muted); border-bottom: 2px solid transparent;
  cursor: pointer; transition: all 0.15s; background: none; border-top: none;
  border-left: none; border-right: none;
}
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tab:hover:not(.active) { color: var(--text-secondary); }
.main { padding: 24px 32px; max-width: 1200px; margin: 0 auto; }
.tab-content { display: none; }
.tab-content.active { display: block; }
.stats-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 16px; margin-bottom: 24px;
}
.stat-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px;
}
.stat-card .label {
  font-size: 12px; font-weight: 500; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;
}
.stat-card .value {
  font-size: 28px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 4px;
}
.stat-card .sub { font-size: 12px; color: var(--text-muted); }
.stat-card .sparkline {
  margin-top: 12px; height: 32px;
  display: flex; align-items: flex-end; gap: 3px;
}
.sparkline .bar {
  flex: 1; background: var(--accent-light); border-radius: 2px;
  min-height: 4px;
}
.dist-section {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 20px; margin-bottom: 24px;
}
.dist-section .section-title {
  font-size: 14px; font-weight: 600; margin-bottom: 16px;
}
.dist-bar {
  display: flex; height: 36px; border-radius: 8px; overflow: hidden;
  margin-bottom: 12px;
}
.dist-bar div {
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 600; color: #fff; min-width: 30px;
}
.dist-legend { display: flex; gap: 20px; flex-wrap: wrap; }
.dist-legend .item {
  display: flex; align-items: center; gap: 6px; font-size: 13px;
  color: var(--text-secondary);
}
.dist-legend .dot { width: 10px; height: 10px; border-radius: 50%; }
.filter-row {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; flex-wrap: wrap; gap: 12px;
}
.filter-chips { display: flex; gap: 6px; }
.filter-chip {
  padding: 6px 14px; border-radius: 20px; font-size: 13px;
  font-weight: 500; cursor: pointer; border: 1px solid var(--border);
  background: var(--surface); color: var(--text-secondary);
  transition: all 0.15s;
}
.filter-chip.active {
  background: var(--accent); color: #fff; border-color: var(--accent);
}
.filter-chip:hover:not(.active) { background: #f1f5f9; }
.controls-right { display: flex; align-items: center; gap: 12px; }
.controls-right select {
  padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
  font-size: 13px; background: var(--surface); color: var(--text-primary);
}
.btn-action {
  padding: 6px 14px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--surface); font-size: 13px; cursor: pointer;
  color: var(--text-secondary); display: inline-flex; align-items: center; gap: 4px;
}
.btn-action:hover { background: #f1f5f9; }
.table-wrap {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
}
table { width: 100%; border-collapse: collapse; }
thead { background: #f8fafc; }
th {
  padding: 12px 16px; font-size: 12px; font-weight: 600;
  color: var(--text-muted); text-transform: uppercase;
  letter-spacing: 0.04em; text-align: left;
  border-bottom: 1px solid var(--border);
}
td {
  padding: 14px 16px; font-size: 13px; vertical-align: top;
  border-bottom: 1px solid #f1f5f9;
}
tbody tr:hover { background: #fafbfc; }
.chip {
  display: inline-flex; align-items: center; padding: 3px 10px;
  border-radius: 6px; font-size: 12px; font-weight: 600;
}
.chip.extremely_high { background: var(--red-bg); color: var(--red); }
.chip.very_high { background: var(--orange-bg); color: var(--orange); }
.chip.high { background: var(--amber-bg); color: var(--amber); }
.chip.medium { background: var(--blue-bg); color: var(--blue); }
.chip.low { background: var(--green-bg); color: var(--green); }
.chip.undefined { background: var(--gray-bg); color: var(--gray); }
.tag {
  display: inline-block; padding: 2px 8px; border-radius: 4px;
  font-size: 11px; background: #f1f5f9; color: var(--text-secondary);
  margin: 2px 2px 0 0;
}
.tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
.td-meta { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
pre.payload {
  max-height: 240px; overflow: auto; background: #0f172a;
  color: #e2e8f0; padding: 16px; border-radius: 8px;
  font-size: 12px; margin-top: 8px;
}
.auth-overlay {
  position: fixed; inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex; align-items: center; justify-content: center;
  z-index: 10;
}
.auth-card {
  background: var(--surface); padding: 32px; border-radius: 20px;
  width: min(420px, 92%);
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
  display: flex; flex-direction: column; gap: 16px;
}
.auth-card h2 { font-size: 20px; font-weight: 600; }
.auth-card .helper { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.auth-card label {
  font-size: 13px; color: var(--text-secondary);
  margin-bottom: 6px; display: block;
}
.auth-card input {
  width: 100%; padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--border); font-size: 14px;
}
.auth-card .form-group { margin-bottom: 12px; }
.auth-card button[type="submit"] {
  width: 100%; padding: 10px 16px; border-radius: 8px;
  border: none; background: var(--accent); color: #fff;
  font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.auth-card button[type="submit"]:hover { background: #1d4ed8; }
.alert {
  padding: 12px 14px; border-radius: 8px;
  background: var(--red-bg); color: var(--red); font-size: 13px;
}
.hidden { display: none !important; }
.status-msg { font-size: 14px; color: var(--text-muted); padding: 20px 0; }
```

- [ ] **Step 2: Verify the CSS compiles into the string without syntax errors**

Run: `cd /Users/yanhan/caresse/cj-frontend && python -c "from backend.app.api.risk_assessment import DASHBOARD_HTML; print('OK, length:', len(DASHBOARD_HTML))"`

If that import path doesn't work, try:
Run: `cd /Users/yanhan/caresse/cj-frontend/backend && python -c "from app.api.risk_assessment import DASHBOARD_HTML; print('OK, length:', len(DASHBOARD_HTML))"`

Expected: `OK, length: <some number>` — no SyntaxError

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/risk_assessment.py
git commit -s -m "refactor: replace dashboard CSS with medical-professional design system"
```

---

### Task 2: Replace HTML structure (header, tabs, login overlay, content containers)

**Files:**
- Modify: `backend/app/api/risk_assessment.py` — the `<body>` section of `DASHBOARD_HTML`

Replace the HTML body with the new structure: header with icon/title/user-info/tabs, main content area with two tab panels (overview + records), and the redesigned login overlay.

- [ ] **Step 1: Replace the `<body>` HTML**

Replace everything from `<body>` to just before `<script>` with the new structure:

```html
<body>
  <div class="auth-overlay hidden" id="auth-overlay">
    <div class="auth-card">
      <div>
        <h2>管理者登入</h2>
        <p class="helper">登入後才可載入儀表板資料，帳號資訊請向系統管理者索取。</p>
      </div>
      <form id="login-form">
        <div class="form-group">
          <label for="login-email">電子郵件</label>
          <input id="login-email" type="email" required />
        </div>
        <div class="form-group">
          <label for="login-password">密碼</label>
          <input id="login-password" type="password" required minlength="8" />
        </div>
        <button type="submit">登入儀表板</button>
      </form>
      <div class="alert hidden" id="login-error"></div>
    </div>
  </div>

  <div class="header">
    <div class="header-top">
      <div class="header-title">
        <div class="icon">\u2665</div>
        <div>
          <h1>心血管評估儀表板</h1>
          <p>快速檢視問卷紀錄與風險分布概況</p>
        </div>
      </div>
      <div class="header-right" id="auth-meta">
        <span class="td-meta">尚未登入</span>
      </div>
    </div>
    <div class="tabs">
      <button class="tab active" data-tab="overview">概覽</button>
      <button class="tab" data-tab="records">評估紀錄</button>
    </div>
  </div>

  <div class="main">
    <div id="status" class="status-msg">資料載入中...</div>

    <div id="tab-overview" class="tab-content active">
      <div class="stats-grid" id="stats-grid"></div>
      <div class="dist-section" id="dist-section" style="display:none;">
        <div class="section-title">風險層級分佈</div>
        <div class="dist-bar" id="dist-bar"></div>
        <div class="dist-legend" id="dist-legend"></div>
      </div>
    </div>

    <div id="tab-records" class="tab-content">
      <div class="filter-row">
        <div class="filter-chips" id="filter-chips">
          <button class="filter-chip active" data-level="all">全部</button>
          <button class="filter-chip" data-level="extremely_high">極高</button>
          <button class="filter-chip" data-level="very_high">非常高</button>
          <button class="filter-chip" data-level="high">高</button>
          <button class="filter-chip" data-level="medium">中</button>
          <button class="filter-chip" data-level="low">低</button>
        </div>
        <div class="controls-right">
          <select id="limit">
            <option value="20">顯示 20 筆</option>
            <option value="50" selected>顯示 50 筆</option>
            <option value="100">顯示 100 筆</option>
          </select>
          <button class="btn-action" type="button" id="refresh">\u21BB 重新整理</button>
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
  </div>
```

Note: `\u2665` is the heart symbol (♥) and `\u21BB` is the refresh arrow (↻). These are used instead of emoji for cross-platform consistency.

- [ ] **Step 2: Verify Python string is valid**

Run: `cd /Users/yanhan/caresse/cj-frontend/backend && python -c "from app.api.risk_assessment import DASHBOARD_HTML; print('OK, length:', len(DASHBOARD_HTML))"`

Expected: `OK, length: <some number>` — no SyntaxError

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/risk_assessment.py
git commit -s -m "refactor: replace dashboard HTML with tab-based layout structure"
```

---

### Task 3: Replace JavaScript (tab switching, renderStats, renderTable, auth)

**Files:**
- Modify: `backend/app/api/risk_assessment.py` — the `<script>` section of `DASHBOARD_HTML`

Replace the entire `<script>` block with updated JavaScript that:
1. Handles tab switching between overview and records
2. Renders stat cards with sparklines in the overview tab
3. Renders the distribution bar in the overview tab
4. Renders the data table in the records tab (same logic, updated class names)
5. Keeps the same auth flow (login, logout, token management)

- [ ] **Step 1: Replace the `<script>` block**

Replace the entire `<script>...</script>` section with the following JavaScript. Key changes from the original:

- `renderStats()` now builds 4 stat cards with sparklines + the distribution bar
- `renderTable()` uses updated class names (`.td-meta`, `.tags`, `.tag`, `.btn-action`)
- New `switchTab()` function toggles `.active` on tabs and content panels
- Tab click listeners and filter chip listeners added
- `updateAuthMeta()` renders into the header-right area with avatar + logout button
- Filter chips use `.filter-chip.active` instead of separate buttons

```javascript
const tokenStorageKey = 'adminDashboardToken';
let accessToken = localStorage.getItem(tokenStorageKey) || '';
let currentAdmin = null;
let currentLevel = 'all';
let cachedData = null;

const statusEl = document.getElementById('status');
const statsGridEl = document.getElementById('stats-grid');
const distSection = document.getElementById('dist-section');
const distBarEl = document.getElementById('dist-bar');
const distLegendEl = document.getElementById('dist-legend');
const tbody = document.getElementById('table-body');
const limitEl = document.getElementById('limit');
const overlay = document.getElementById('auth-overlay');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

const LEVEL_LABELS = {
  extremely_high: '極高',
  very_high: '非常高',
  high: '高',
  medium: '中',
  low: '低',
  undefined: '未定義',
};

const LEVEL_COLORS = {
  extremely_high: 'var(--red)',
  very_high: 'var(--orange)',
  high: 'var(--amber)',
  medium: 'var(--blue)',
  low: 'var(--green)',
  undefined: 'var(--gray)',
};

const METABOLIC_LABELS = {
  abdominalObesity: '腹部肥胖',
  elevatedBloodPressure: '血壓偏高或治療中',
  elevatedGlucose: '空腹血糖偏高或使用降糖藥',
  elevatedTriglyceride: '三酸甘油酯偏高或治療中',
  lowHdl: 'HDL-C 偏低',
};

/* --- Tab switching --- */
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* --- Filter chips --- */
document.getElementById('filter-chips').addEventListener('click', (e) => {
  const chip = e.target.closest('.filter-chip');
  if (!chip) return;
  currentLevel = chip.dataset.level;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  if (cachedData) renderTable(cachedData.assessments || []);
});

/* --- Auth helpers --- */
function updateAuthMeta(admin) {
  const metaEl = document.getElementById('auth-meta');
  if (!admin) {
    metaEl.innerHTML = '<span class="td-meta">尚未登入</span>';
    return;
  }
  const lastLogin = admin.lastLoginAt
    ? new Date(admin.lastLoginAt).toLocaleString()
    : '—';
  metaEl.innerHTML =
    '<div class="avatar">' + admin.email.charAt(0).toUpperCase() + '</div>' +
    '<div>' +
      '<div style="font-weight:500;color:var(--text-primary)">' + admin.email + '</div>' +
      '<div style="font-size:12px">上次登入：' + lastLogin + '</div>' +
    '</div>' +
    '<button class="logout-btn" id="logout-btn">登出</button>';
  document.getElementById('logout-btn').addEventListener('click', doLogout);
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

function doLogout() {
  accessToken = '';
  currentAdmin = null;
  localStorage.removeItem(tokenStorageKey);
  updateAuthMeta(null);
  showLogin('已登出。');
}

async function fetchWithAuth(url, options) {
  options = options || {};
  if (!accessToken) throw new Error('missing_token');
  var headers = new Headers(options.headers || {});
  headers.set('Authorization', 'Bearer ' + accessToken);
  headers.set('Accept', 'application/json');
  return fetch(url, Object.assign({}, options, { headers: headers }));
}

/* --- Sparkline helper --- */
function sparklineHTML(heights, color) {
  color = color || 'var(--accent-light)';
  return '<div class="sparkline">' +
    heights.map(function(h) {
      return '<div class="bar" style="height:' + h + '%;background:' + color + '"></div>';
    }).join('') +
    '</div>';
}

/* --- Render overview --- */
function renderStats(stats) {
  if (!stats || !stats.totalAssessments) {
    statsGridEl.innerHTML =
      '<div class="stat-card"><div class="label">尚無資料</div>' +
      '<div class="value">—</div><div class="sub">等待新評估紀錄</div></div>';
    distSection.style.display = 'none';
    return;
  }

  var total = stats.totalAssessments;
  var avg = stats.averageRiskFactorCount;
  var latest = stats.latestAssessmentAt
    ? new Date(stats.latestAssessmentAt).toLocaleString()
    : '—';
  var latestDate = stats.latestAssessmentAt
    ? new Date(stats.latestAssessmentAt).toLocaleDateString()
    : '—';
  var latestTime = stats.latestAssessmentAt
    ? new Date(stats.latestAssessmentAt).toLocaleTimeString()
    : '';

  var highCount =
    (stats.byLevel.extremely_high || 0) +
    (stats.byLevel.very_high || 0) +
    (stats.byLevel.high || 0);
  var highPct = total > 0 ? (highCount / total * 100).toFixed(1) : '0.0';

  statsGridEl.innerHTML =
    '<div class="stat-card">' +
      '<div class="label">總評估次數</div>' +
      '<div class="value">' + total + '</div>' +
      '<div class="sub">最新：' + latest + '</div>' +
      sparklineHTML([40, 60, 45, 80, 100, 70, 55]) +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="label">平均危險因子</div>' +
      '<div class="value">' + (avg !== null ? avg.toFixed(1) : '—') + '</div>' +
      '<div class="sub">含所有風險層級</div>' +
      sparklineHTML([30, 50, 35, 45, 30, 55, 40]) +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="label">高風險佔比</div>' +
      '<div class="value">' + highPct + '%</div>' +
      '<div class="sub">極高 + 非常高 + 高</div>' +
      sparklineHTML([70, 50, 65, 80, 55, 45, 60], 'var(--red-bg)') +
    '</div>' +
    '<div class="stat-card">' +
      '<div class="label">最新評估</div>' +
      '<div class="value" style="font-size:22px">' + latestDate + '</div>' +
      '<div class="sub">' + latestTime + '</div>' +
    '</div>';

  /* Distribution bar */
  var levels = ['extremely_high', 'very_high', 'high', 'medium', 'low', 'undefined'];
  var barHTML = '';
  var legendHTML = '';
  levels.forEach(function(code) {
    var count = stats.byLevel[code] || 0;
    if (count === 0) return;
    var pct = (count / total * 100);
    barHTML +=
      '<div style="width:' + pct + '%;background:' + LEVEL_COLORS[code] + '">' +
        (pct > 4 ? count : '') +
      '</div>';
    legendHTML +=
      '<div class="item">' +
        '<div class="dot" style="background:' + LEVEL_COLORS[code] + '"></div>' +
        LEVEL_LABELS[code] + ' ' + count + ' (' + pct.toFixed(1) + '%)' +
      '</div>';
  });
  distBarEl.innerHTML = barHTML;
  distLegendEl.innerHTML = legendHTML;
  distSection.style.display = '';
}

/* --- Render table --- */
function renderTable(records) {
  var filtered = currentLevel === 'all'
    ? records
    : records.filter(function(r) { return r.levelCode === currentLevel; });

  if (!filtered.length) {
    tbody.innerHTML =
      '<tr><td colspan="6" class="td-meta" style="padding:20px 16px">' +
      '尚未有符合條件的評估紀錄。</td></tr>';
    return;
  }

  tbody.innerHTML = filtered.map(function(record) {
    var riskFactors = (record.riskFactors || [])
      .filter(function(f) { return f.present; })
      .map(function(f) { return '<span class="tag">' + f.label + '</span>'; })
      .join('');

    var matchedRules = (record.matchedRules || [])
      .map(function(r) { return '<span class="tag">' + r.label + '</span>'; })
      .join('') || '<span class="td-meta">—</span>';

    var metabolicTags = Object.entries(record.metabolicSyndrome?.components || {})
      .filter(function(e) { return e[1]; })
      .map(function(e) {
        return '<span class="tag">' + (METABOLIC_LABELS[e[0]] || e[0]) + '</span>';
      })
      .join('') || '<span class="td-meta">—</span>';

    var dt = new Date(record.createdAt);

    return '<tr>' +
      '<td><div>' + dt.toLocaleDateString() + '</div>' +
        '<div class="td-meta">' + dt.toLocaleTimeString() + '</div></td>' +
      '<td><span class="chip ' + (record.levelCode || 'undefined') + '">' +
        (LEVEL_LABELS[record.levelCode] || record.level) + '</span></td>' +
      '<td><div><strong>' + record.riskFactorCount + ' 項</strong></div>' +
        '<div class="tags">' + riskFactors + '</div></td>' +
      '<td><div class="tags">' + matchedRules + '</div></td>' +
      '<td><div><strong>' + (record.metabolicSyndrome?.count ?? 0) + ' / 5</strong></div>' +
        '<div class="tags">' + metabolicTags + '</div></td>' +
      '<td><details><summary class="btn-action" style="list-style:none;font-size:12px;padding:4px 10px">JSON</summary>' +
        '<pre class="payload">' + JSON.stringify(record.payload || {}, null, 2) + '</pre>' +
      '</details></td>' +
    '</tr>';
  }).join('');
}

/* --- Data loading --- */
async function loadDashboard() {
  if (!accessToken) { showLogin(); return; }
  statusEl.textContent = '資料載入中...';
  statusEl.classList.remove('hidden');

  try {
    var response = await fetchWithAuth('/api/admin/assessments?limit=' + limitEl.value);
    if (response.status === 401) throw new Error('unauthorized');
    var data = await response.json();
    cachedData = data;
    renderStats(data.stats);
    renderTable(data.assessments || []);
    statusEl.classList.add('hidden');
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

/* --- Login --- */
loginForm.addEventListener('submit', async function(event) {
  event.preventDefault();
  var email = document.getElementById('login-email').value;
  var password = document.getElementById('login-password').value;
  var submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = '登入中...';
  loginError.classList.add('hidden');

  try {
    var response = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ email: email, password: password }),
    });

    if (!response.ok) {
      var payload = await response.json().catch(function() { return {}; });
      throw new Error(payload.detail || '登入失敗，請確認帳號密碼。');
    }

    var result = await response.json();
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

/* --- Bootstrap --- */
async function bootstrap() {
  if (!accessToken) { showLogin(); return; }
  try {
    var response = await fetchWithAuth('/api/admin/me');
    if (!response.ok) throw new Error('unauthorized');
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
```

- [ ] **Step 2: Verify Python string is valid**

Run: `cd /Users/yanhan/caresse/cj-frontend/backend && python -c "from app.api.risk_assessment import DASHBOARD_HTML; print('OK, length:', len(DASHBOARD_HTML))"`

Expected: `OK, length: <some number>` — no SyntaxError

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/risk_assessment.py
git commit -s -m "refactor: replace dashboard JS with tab switching and stat cards"
```

---

### Task 4: Manual verification

**Files:**
- None (read-only verification)

Start the backend server and manually verify all dashboard functionality in a browser.

- [ ] **Step 1: Start the backend server**

Run: `cd /Users/yanhan/caresse/cj-frontend/backend && python -m uvicorn app.main:app --reload --port 8000`

Open browser to: `http://localhost:8000/api/admin/dashboard`

- [ ] **Step 2: Verify login flow**

1. Page loads → login overlay appears
2. Enter admin credentials → click "登入儀表板"
3. On success → overlay closes, header shows email + avatar + logout button
4. On failure → red error alert appears

- [ ] **Step 3: Verify overview tab**

1. Default tab is "概覽" (active, blue underline)
2. Four stat cards visible: 總評估次數, 平均危險因子, 高風險佔比, 最新評估
3. Each card (except latest) has a sparkline bar chart
4. Distribution bar shows colored segments for each risk level
5. Legend below bar shows counts and percentages

- [ ] **Step 4: Verify records tab**

1. Click "評估紀錄" tab → table appears
2. Filter chips work: clicking "極高" filters to only extremely_high rows, "全部" resets
3. Active chip is blue, others are outlined
4. Limit dropdown changes query (20/50/100)
5. "重新整理" button reloads data
6. Table rows show: date/time, colored level chip, risk factor count + tags, matched rule tags, metabolic count/5 + tags, JSON details button

- [ ] **Step 5: Verify logout**

1. Click "登出" → login overlay reappears with "已登出。" message
2. Header resets to "尚未登入"

- [ ] **Step 6: Fix any visual issues found during verification**

If spacing, alignment, or colors need tweaking, adjust the CSS in `DASHBOARD_HTML` and reload.

- [ ] **Step 7: Final commit**

```bash
git add backend/app/api/risk_assessment.py
git commit -s -m "feat: complete admin dashboard UI redesign"
```
