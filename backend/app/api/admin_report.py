"""後台統計報告：API 與可列印（另存 PDF）的報告頁面。"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, status
from fastapi.responses import HTMLResponse
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_admin
from app.db.session import get_session
from app.models import AdminAccount, Assessment
from app.schemas import AssessmentReport, MonthlyCount, RiskLevelCodeEnum

router = APIRouter(prefix="/api", tags=["admin-report"])

# Taiwan has no daylight saving time, so a fixed offset avoids a tzdata dependency.
TAIWAN_TZ = timezone(timedelta(hours=8))


def _to_taiwan(value: datetime) -> datetime:
    """SQLite 回傳的時間不帶時區，視為 UTC 後轉成台灣時間。"""

    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    return value.astimezone(TAIWAN_TZ)


def _monthly_counts(timestamps: list[datetime]) -> list[MonthlyCount]:
    """依台灣時間分月計數，並補齊首月到末月之間沒有資料的月份。"""

    counts: dict[tuple[int, int], int] = {}
    for ts in timestamps:
        local = _to_taiwan(ts)
        key = (local.year, local.month)
        counts[key] = counts.get(key, 0) + 1

    if not counts:
        return []

    year, month = min(counts)
    last = max(counts)
    months: list[MonthlyCount] = []
    while (year, month) <= last:
        months.append(
            MonthlyCount(month=f"{year:04d}-{month:02d}", count=counts.get((year, month), 0))
        )
        year, month = (year + 1, 1) if month == 12 else (year, month + 1)
    return months


@router.get(
    "/admin/report",
    response_model=AssessmentReport,
    status_code=status.HTTP_200_OK,
)
def get_assessment_report(
    session: Session = Depends(get_session),
    _current_admin: AdminAccount = Depends(get_current_admin),
) -> AssessmentReport:
    """提供統計報告所需的總數、層級分佈與每月填寫次數。"""

    level_rows = session.execute(
        select(Assessment.level_code, func.count()).group_by(Assessment.level_code)
    ).all()
    by_level_raw = {
        (code if code is not None else RiskLevelCodeEnum.UNDEFINED.value): count
        for code, count in level_rows
    }

    timestamps = list(
        session.execute(select(Assessment.created_at).order_by(Assessment.created_at))
        .scalars()
        .all()
    )

    return AssessmentReport(
        totalAssessments=len(timestamps),
        byLevel={
            level: by_level_raw.get(level.value, 0) for level in RiskLevelCodeEnum
        },
        monthly=_monthly_counts(timestamps),
        firstAssessmentAt=timestamps[0] if timestamps else None,
        latestAssessmentAt=timestamps[-1] if timestamps else None,
    )


REPORT_HTML = """
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<title>心血管風險評估統計報告</title>
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
*{margin:0;padding:0;box-sizing:border-box}
:root{
  --bg:#f8fafb;--surface:#ffffff;--border:#e2e8f0;
  --text-primary:#1a2332;--text-secondary:#5a6577;--text-muted:#8892a4;
  --accent:#2563eb;
}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang TC","Microsoft JhengHei",sans-serif;background:var(--bg);color:var(--text-primary);font-size:13px;line-height:1.6}
.toolbar{max-width:820px;margin:0 auto;padding:16px 16px 0;display:flex;justify-content:space-between;align-items:center;gap:12px}
.toolbar a{color:var(--text-secondary);text-decoration:none;font-size:13px}
.btn{background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 16px;font-size:13px;font-weight:600;cursor:pointer}
.btn:disabled{opacity:.5;cursor:not-allowed}
.page{max-width:820px;margin:16px auto 40px;background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:40px 44px}
h1{font-size:22px;font-weight:700;margin-bottom:4px}
.subtitle{color:var(--text-secondary);font-size:12px;margin-bottom:28px}
h2{font-size:15px;font-weight:600;margin:32px 0 12px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.summary{display:grid;grid-template-columns:repeat(2,1fr);gap:12px}
.card{border:1px solid var(--border);border-radius:10px;padding:14px 18px}
.card .label{color:var(--text-muted);font-size:12px}
.card .value{font-size:26px;font-weight:700;margin-top:2px}
.card .value.small{font-size:16px;padding-top:8px}
table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px}
th,td{text-align:left;padding:6px 8px;border-bottom:1px solid var(--border)}
th{color:var(--text-muted);font-weight:500}
td.num,th.num{text-align:right;font-variant-numeric:tabular-nums}
.note{color:var(--text-muted);font-size:11px;margin-top:8px}
.notes{margin-top:32px;color:var(--text-secondary);font-size:11px}
.notes li{margin-left:18px}
.status{text-align:center;color:var(--text-secondary);padding:60px 0}
svg text{font-family:inherit}
@media (max-width:600px){.page{padding:24px 16px}.summary{grid-template-columns:1fr}}
@media print{
  @page{size:A4;margin:14mm}
  body{background:#fff}
  .toolbar{display:none}
  .page{border:none;border-radius:0;margin:0;padding:0;max-width:none}
  h2,.chart,table{break-inside:avoid}
  *{-webkit-print-color-adjust:exact;print-color-adjust:exact}
}
</style>
</head>
<body>
<div class="toolbar">
  <a href="/api/admin/dashboard">← 回儀表板</a>
  <button class="btn" id="print-btn" type="button" disabled>下載 PDF</button>
</div>
<div class="page" id="page"><div class="status">資料載入中...</div></div>

<script>
var TOKEN_KEY = 'adminDashboardToken';

var LEVELS = [
  { code: 'extremely_high', label: '極高', color: '#dc2626' },
  { code: 'very_high', label: '非常高', color: '#ea580c' },
  { code: 'high', label: '高', color: '#d97706' },
  { code: 'medium', label: '中', color: '#2563eb' },
  { code: 'low', label: '低', color: '#059669' },
  { code: 'no_risk', label: '無風險', color: '#0d9488' },
  { code: 'undefined', label: '資料不完整', color: '#6b7280' }
];

function esc(s) {
  return String(s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' });
}

function showStatus(html) {
  document.getElementById('page').innerHTML = '<div class="status">' + html + '</div>';
}

/* Horizontal bar chart: one row per level, count and percentage at the bar end. */
function levelChartSVG(rows, total) {
  var width = 720, rowH = 34, labelW = 90, valueW = 110;
  var barMax = width - labelW - valueW;
  var maxCount = Math.max.apply(null, rows.map(function(r) { return r.count; }).concat([1]));
  var height = rows.length * rowH;
  var svg = '<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" width="100%" role="img" aria-label="風險層級分佈長條圖">';
  rows.forEach(function(r, i) {
    var y = i * rowH;
    var w = Math.max((r.count / maxCount) * barMax, r.count > 0 ? 2 : 0);
    var pct = total > 0 ? (r.count / total * 100).toFixed(1) : '0.0';
    svg += '<text x="' + (labelW - 10) + '" y="' + (y + 21) + '" text-anchor="end" font-size="13" fill="#1a2332">' + esc(r.label) + '</text>';
    svg += '<rect x="' + labelW + '" y="' + (y + 7) + '" width="' + w.toFixed(1) + '" height="20" rx="4" fill="' + r.color + '"></rect>';
    svg += '<text x="' + (labelW + w + 8) + '" y="' + (y + 21) + '" font-size="12" fill="#5a6577">' + r.count + ' 次（' + pct + '%）</text>';
  });
  return svg + '</svg>';
}

/* Line chart of monthly counts with a value label on every point. */
function monthlyChartSVG(monthly) {
  var width = 720, height = 260, padL = 44, padR = 20, padT = 24, padB = 44;
  var plotW = width - padL - padR, plotH = height - padT - padB;
  var maxCount = Math.max.apply(null, monthly.map(function(m) { return m.count; }).concat([1]));
  var step = Math.max(1, Math.ceil(maxCount / 4));
  var yMax = step * 4;
  var n = monthly.length;
  var xAt = function(i) { return padL + (n === 1 ? plotW / 2 : (i / (n - 1)) * plotW); };
  var yAt = function(v) { return padT + plotH - (v / yMax) * plotH; };
  var labelEvery = Math.ceil(n / 12);

  var svg = '<svg class="chart" viewBox="0 0 ' + width + ' ' + height + '" width="100%" role="img" aria-label="每月填寫次數折線圖">';
  for (var g = 0; g <= 4; g++) {
    var gv = step * g, gy = yAt(gv);
    svg += '<line x1="' + padL + '" x2="' + (width - padR) + '" y1="' + gy + '" y2="' + gy + '" stroke="#e2e8f0"></line>';
    svg += '<text x="' + (padL - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="#8892a4">' + gv + '</text>';
  }
  var points = monthly.map(function(m, i) { return xAt(i).toFixed(1) + ',' + yAt(m.count).toFixed(1); }).join(' ');
  svg += '<polyline points="' + points + '" fill="none" stroke="#2563eb" stroke-width="2"></polyline>';
  monthly.forEach(function(m, i) {
    var x = xAt(i), y = yAt(m.count);
    svg += '<circle cx="' + x + '" cy="' + y + '" r="3.5" fill="#2563eb"></circle>';
    svg += '<text x="' + x + '" y="' + (y - 8) + '" text-anchor="middle" font-size="11" fill="#1a2332">' + m.count + '</text>';
    if (i % labelEvery === 0 || i === n - 1) {
      svg += '<text x="' + x + '" y="' + (height - padB + 18) + '" text-anchor="middle" font-size="11" fill="#5a6577">' + esc(m.month) + '</text>';
    }
  });
  return svg + '</svg>';
}

function renderReport(data) {
  var total = data.totalAssessments;
  var rows = LEVELS.map(function(l) {
    return { label: l.label, color: l.color, count: data.byLevel[l.code] || 0 };
  });
  var generatedAt = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', hour12: false });

  var html =
    '<h1>心血管風險評估 統計報告</h1>' +
    '<div class="subtitle">產出時間：' + esc(generatedAt) + '（台灣時間）</div>' +
    '<div class="summary">' +
      '<div class="card"><div class="label">總填寫次數</div><div class="value">' + total + '</div></div>' +
      '<div class="card"><div class="label">資料期間</div><div class="value small">' +
        esc(formatDate(data.firstAssessmentAt)) + ' – ' + esc(formatDate(data.latestAssessmentAt)) +
      '</div></div>' +
    '</div>';

  html += '<h2>風險層級分佈</h2>' + levelChartSVG(rows, total);
  html += '<table><thead><tr><th>風險層級</th><th class="num">次數</th><th class="num">佔比</th></tr></thead><tbody>';
  rows.forEach(function(r) {
    var pct = total > 0 ? (r.count / total * 100).toFixed(1) : '0.0';
    html += '<tr><td>' + esc(r.label) + '</td><td class="num">' + r.count + '</td><td class="num">' + pct + '%</td></tr>';
  });
  html += '<tr><td><strong>合計</strong></td><td class="num"><strong>' + total + '</strong></td><td class="num">100%</td></tr></tbody></table>';

  html += '<h2>每月填寫次數</h2>';
  html += data.monthly.length ? monthlyChartSVG(data.monthly) : '<div class="note">尚無資料。</div>';

  html +=
    '<ul class="notes">' +
      '<li>問卷為匿名填寫，統計以「填寫次數」計算，無法區分同一人重複填寫。</li>' +
      '<li>「資料不完整」：未發現危險因子，但核心資料（年齡、性別、血壓、血脂）未填齊，無法判定風險層級。</li>' +
      '<li>月份依台灣時間（UTC+8）劃分。</li>' +
    '</ul>';

  document.getElementById('page').innerHTML = html;
  document.getElementById('print-btn').disabled = false;
}

function loadReport() {
  var token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
  if (!token) {
    showStatus('請先<a href="/api/admin/dashboard">登入儀表板</a>，再開啟統計報告。');
    return;
  }
  fetch('/api/admin/report', { headers: { 'Authorization': 'Bearer ' + token, 'Accept': 'application/json' } })
    .then(function(res) {
      if (res.status === 401) throw new Error('unauthorized');
      if (!res.ok) throw new Error('failed');
      return res.json();
    })
    .then(renderReport)
    .catch(function(err) {
      if (err.message === 'unauthorized') {
        showStatus('登入已失效，請<a href="/api/admin/dashboard">重新登入儀表板</a>。');
      } else {
        showStatus('報告載入失敗，請稍後再試。');
      }
    });
}

document.getElementById('print-btn').addEventListener('click', function() { window.print(); });
loadReport();
</script>
</body>
</html>
"""


@router.get(
    "/admin/report-view",
    response_class=HTMLResponse,
    include_in_schema=False,
)
async def serve_report_page() -> HTMLResponse:
    """提供可列印成 PDF 的統計報告頁面。"""

    return HTMLResponse(content=REPORT_HTML)
