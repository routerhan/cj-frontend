# Admin Dashboard Redesign — Design Spec

## Context

The cardiovascular risk assessment application has an admin dashboard served as a single-page HTML embedded in the FastAPI backend (`backend/app/api/risk_assessment.py`). The current UI is functional but visually unprofessional — poor spacing, inconsistent sizing, raw timestamp formats, and a flat layout that doesn't match medical-grade expectations.

**Target user:** Physicians and clinical staff who need to quickly review patient risk assessment results and understand risk distribution patterns.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Top tab navigation (Overview / Records) | Separates concerns — overview for at-a-glance stats, records for detailed data. Each tab gets full viewport width. |
| Overview tab | Stat cards with sparklines + stacked distribution bar | Balanced information density — cards show key metrics with mini trends, distribution bar shows risk breakdown at a glance. |
| Records tab | Full-info table with optimized layout | Clinical users prefer all data visible without extra clicks. Optimized column widths and typography make it scannable. |
| Visual style | Medical-professional — muted palette, high readability | Matches EMR system conventions. Neutral backgrounds, clear type hierarchy, rounded but restrained corners. |
| Scope | UI-only redesign | Keep the embedded single-page HTML architecture. No new API endpoints. No frontend framework. |

## Architecture

The dashboard remains a single HTML string (`DASHBOARD_HTML`) in `backend/app/api/risk_assessment.py`, served at `GET /api/admin/dashboard`. No changes to the API contract (`/api/admin/login`, `/api/admin/me`, `/api/admin/assessments`).

### Component Structure

```
<header>
  ├── header-top: logo/title + user info + logout
  └── tabs: [概覽] [評估紀錄]
</header>
<main>
  ├── tab-overview
  │   ├── stats-grid (4 cards)
  │   │   ├── Total assessments + sparkline
  │   │   ├── Average risk factors + sparkline
  │   │   ├── High-risk percentage + sparkline
  │   │   └── Latest assessment date
  │   └── distribution-section
  │       ├── Horizontal stacked bar (6 risk levels)
  │       └── Legend with counts and percentages
  └── tab-records
      ├── filter-row
      │   ├── filter chips: [全部] [極高] [非常高] [高] [中] [低]
      │   └── controls: limit select + refresh button
      └── table
          ├── thead: 建立時間 | 風險層級 | 危險因子 | 命中規則 | 代謝症候群 | 原始資料
          └── tbody: full-info rows with tags
</main>
```

### Login Overlay

The existing login overlay stays functionally identical. Visual updates:
- Centered card with the same border-radius and shadow treatment as the rest of the UI
- Input fields and button use the new design system styles
- Error alert uses the same chip/tag visual language

## Visual Design System

### Color Palette

```
Background:      #f8fafb
Surface:         #ffffff
Border:          #e2e8f0
Text primary:    #1a2332
Text secondary:  #5a6577
Text muted:      #8892a4
Accent:          #2563eb

Risk levels:
  Extremely high: #dc2626 (bg: rgba(220,38,38,0.08))
  Very high:      #ea580c (bg: rgba(234,88,12,0.08))
  High:           #d97706 (bg: rgba(217,119,6,0.08))
  Medium:         #2563eb (bg: rgba(37,99,235,0.08))
  Low:            #059669 (bg: rgba(5,150,105,0.08))
  Undefined:      #6b7280 (bg: rgba(107,114,128,0.08))
```

### Typography

- **Page title:** 20px, font-weight 600
- **Stat values:** 28px, font-weight 700
- **Section titles:** 14px, font-weight 600
- **Labels:** 12px, font-weight 500, uppercase, letter-spacing 0.05em
- **Body text:** 13px
- **Muted/sub text:** 12px, color text-muted
- **Font stack:** -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

### Spacing & Sizing

- **Border radius:** 12px (cards, sections), 8px (inputs, buttons), 6px (chips), 4px (tags)
- **Card padding:** 20px
- **Main content padding:** 24px 32px
- **Grid gap:** 16px
- **Stats grid:** 4 columns, responsive via `grid-template-columns: repeat(4, 1fr)`

### Interactive States

- **Tab active:** accent color + 2px bottom border
- **Tab hover:** text darkens
- **Table row hover:** #fafbfc background
- **Filter chip active:** accent background, white text
- **Filter chip hover:** #f1f5f9 background
- **Buttons:** 1px border, hover darkens background

## Stat Cards Detail

Each stat card contains:
1. **Label** — uppercase, muted (e.g., "總評估次數")
2. **Value** — large number (e.g., "130")
3. **Sub text** — contextual info (e.g., "最新：2026/4/9 09:49")
4. **Sparkline** — 7-bar mini chart showing recent trend

Card definitions:

| Card | Label | Value source | Sub text | Sparkline |
|------|-------|-------------|----------|-----------|
| 1 | 總評估次數 | `stats.totalAssessments` | 最新：`stats.latestAssessmentAt` formatted | Decorative bars (no real time-series data in current API) |
| 2 | 平均危險因子 | `stats.averageRiskFactorCount` (1 decimal) | "含所有風險層級" | Decorative bars |
| 3 | 高風險佔比 | `(extremely_high + very_high + high) / total * 100` | "極高 + 非常高 + 高" | Decorative bars with red-tinted color |
| 4 | 最新評估 | `stats.latestAssessmentAt` date portion | Time portion | None — just date display |

**Note:** The current API does not provide time-series data, so sparklines are decorative placeholders showing the concept. They use static proportional bars. If time-series data is added in the future, these can be wired up.

## Distribution Bar Detail

- **Type:** Horizontal stacked bar chart, pure CSS (no chart library)
- **Data source:** `stats.byLevel` object
- **Width:** Each segment proportional to `count / totalAssessments * 100%`
- **Labels:** Count number centered in each segment (hidden if segment too narrow)
- **Legend:** Below the bar, showing `dot + label + count (percentage)` for each level
- **Colors:** Match the risk level color palette

## Table Detail

Columns and data mapping:

| Column | Content | Format |
|--------|---------|--------|
| 建立時間 | `record.createdAt` | Date on line 1, time on line 2 (muted) |
| 風險層級 | `record.levelCode` | Colored chip with Chinese label |
| 危險因子 | `record.riskFactorCount` + `record.riskFactors` | Bold count + tags for present factors |
| 命中規則 | `record.matchedRules` | Tags for each rule label, "—" if empty |
| 代謝症候群 | `record.metabolicSyndrome` | Bold count/5 + tags for present components |
| 原始資料 | `record.payload` | "JSON" button → `<details>` with `<pre>` block |

## Tab Switching

Client-side only. JavaScript toggles `.active` class on tab elements and corresponding content divs. Default tab on load: 概覽 (overview).

## What Does NOT Change

- Backend API contract (endpoints, request/response schemas)
- Authentication flow (JWT login, token storage in localStorage)
- File location (embedded HTML string in `risk_assessment.py`)
- Functional behavior (filtering, limit selection, refresh, logout)
- No external dependencies (no chart libraries, no CSS frameworks)
