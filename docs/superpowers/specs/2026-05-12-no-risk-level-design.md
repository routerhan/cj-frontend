# 新增「無風險」評估等級設計

- **Date**: 2026-05-12
- **Status**: Draft
- **Author**: Yan Han Chen (with Claude)

## Background

The questionnaire risk assessment currently returns one of six level codes:
`extremely_high`, `very_high`, `high`, `medium`, `low`, `undefined`.

The `undefined` ("未定義") bucket is the fallback for "no rules matched and
zero risk factors counted." In practice this conflates two semantically
different outcomes:

1. The respondent is genuinely healthy (no rules matched because none apply).
2. The respondent did not fill in enough fields to be evaluated.

Reporting both as "未定義" misleads end users and skews dashboard statistics.

## Goal

Split the conflated bucket so that:

- A complete questionnaire with no triggered rules returns a new **`no_risk`**
  ("無風險") level.
- `undefined` is reserved for **incomplete core fields only**.

The rule-matching logic itself does not change. No data migration is performed
on historical records.

## Non-Goals

- Refactoring the duplicated evaluation logic between frontend
  (`src/utils/riskRules.js`) and backend
  (`backend/app/services/risk_assessment.py`).
- Backfilling or re-evaluating existing assessments in the database.
- Surfacing partial-data results (e.g. "Very High — data incomplete"); rule
  matches always win, completeness is only checked in the fallback branch.

## Decisions Locked In Through Brainstorming

| Topic | Decision |
|---|---|
| Definition of "incomplete data" | A defined "core field list" with any missing entry |
| Core field list | `age` (from `birthDate`), `gender`/`sex`, `systolic`, `diastolic`, `ldl_c`, `hdl_c`, `triglyceride` |
| Rule precedence vs. completeness | Rule matches always win; completeness is only checked when no rule matches and `risk_factor_count == 0` |
| Historical data | Leave existing `undefined` rows untouched; new logic only applies to new evaluations |

## Architecture

### Level taxonomy

| Code | Label (zh-Hant) | Color hint |
|---|---|---|
| `extremely_high` | 極高 | red |
| `very_high` | 非常高 | orange-red |
| `high` | 高 | orange |
| `medium` | 中 | yellow |
| `low` | 低 | light green |
| **`no_risk`** *(new)* | **無風險** | **green** |
| `undefined` | 未定義 | gray |

### Evaluation flow

```
1. Run EXTREME rules        → if any match, return extremely_high
2. Run VERY_HIGH rules      → if any match, return very_high
3. Run HIGH rules           → if any match, return high
4. risk_factor_count >= 2   → return medium
5. risk_factor_count == 1   → return low
6. Fallback (no rule match AND zero factors):
     hasCoreFields(input) == True   → no_risk    (new branch)
     hasCoreFields(input) == False  → undefined  (narrowed semantics)
```

Steps 1–5 are unchanged from current behavior.

### `hasCoreFields` (pure function, mirrored on both sides)

```
hasCoreFields(input):
  return (
    input.age          is not None and
    input.gender       in {'male', 'female', 'other'} and
    input.systolic     is not None and
    input.diastolic    is not None and
    input.ldl_c        is not None and
    input.hdl_c        is not None and
    input.triglyceride is not None
  )
```

Notes:

- Empty strings are already normalized to `null`/`None` upstream (frontend
  `toNumber`, backend Pydantic), so the function only needs to test for null.
- Boolean clinical-history fields are NOT in the core list — their default of
  `False` (= "not reported") is acceptable.
- `fasting_glucose`, `waist_cm`, `egfr`, `uacr`, etc. are NOT in the core list
  even though they participate in some rules — missing them does not block
  evaluation since rules can still trigger from other inputs.

## Component-Level Changes

### Backend

**`backend/app/schemas/risk_assessment.py`**
- Add `NO_RISK = "no_risk"` to `RiskLevelCodeEnum`.

**`backend/app/services/risk_assessment.py`**
- Add `RiskLevelCodeEnum.NO_RISK: "無風險"` to the `_title_by_code` mapping.
- Add a `RECOMMENDATIONS[NO_RISK]` entry, e.g.
  - "維持目前健康生活型態，包含規律運動、均衡飲食、不抽菸"
  - "建議每 1–2 年定期回檢血壓、血脂與基本血液檢查"
- Update `RECOMMENDATIONS[UNDEFINED]` to clearly mean "incomplete data",
  e.g. "評估所需的基本資料尚未填寫完整，請補齊年齡、性別、血壓、血脂後重新評估"
- Add helper `_has_core_fields(payload: RiskAssessmentRequest) -> bool`.
- Modify the terminal branch of `evaluate()` to choose between `NO_RISK` and
  `UNDEFINED` based on `_has_core_fields`.

**`backend/app/api/risk_assessment.py`** (admin dashboard inline HTML/JS)
- Add `no_risk: '無風險'` to `LEVEL_LABELS`.
- Add `no_risk: 'var(--green)'` to `LEVEL_COLORS` (introduce `--green` CSS
  variable if not already defined).
- Add a `.chip.no-risk` rule paralleling the other chip classes.
- Add `'no_risk'` to the ordered display array, positioned between `'low'`
  and `'undefined'`.
- Confirm `level_distribution` aggregation gracefully handles the new code
  (existing `dict.get(..., 0)` style already does).

### Frontend

**`src/utils/riskRules.js`**
- Add `NO_RISK: { code: 'no_risk', label: '無風險' }` to `RiskLevels`.
- Add `RECOMMENDATIONS['no_risk']` and update `RECOMMENDATIONS['undefined']`
  to mirror the backend texts.
- Add `hasCoreFields(input)` helper.
- Update `evaluateRiskAssessment()` terminal branch to mirror the backend.

**`src/steps/Step4_Report.jsx`**
- Add `no_risk` entry to `levelDescriptions`.
- Add `no_risk` entry to `ldlTargets`; for `no_risk` the LDL-target section is
  hidden (`showLdlTarget` returns false for `no_risk`, same as `undefined`).
- Ensure the level chip / color class reflects the new code.

**Styles** (`Step4_Report.module.css` and any shared chip stylesheet)
- Add `.no-risk` / `--green` styling.

### Tests

**`src/utils/riskRules.test.js`**
- Split the existing "風險因子為零時回傳未定義層級" test into:
  - "核心欄位齊全且 0 風險因子時回傳 no_risk"
  - "核心欄位缺漏且 0 風險因子時回傳 undefined"
- Add: "核心欄位缺漏但命中 EXTREME 規則時仍回傳 extremely_high"
- Add: "核心欄位缺漏但風險因子達 2 項時回傳 medium"

**Backend service tests** (mirror the four cases above).

### Manual QA Checklist

- Walk Step1–Step5 with a healthy profile → report shows "無風險" (green).
- Skip Step2 blood-pressure entry → report shows "未定義" (gray) with the
  updated guidance text.
- Tick ASCVD history without blood-pressure/lipid input → report shows
  "非常高" (rule wins).
- Admin dashboard chip ordering: 極高 → 非常高 → 高 → 中 → 低 → **無風險** →
  未定義.

## Out of Scope / Future Work

- Rendering "未定義 (missing: systolic, ldl_c, …)" with field-level detail.
- A migration that re-evaluates historical assessments against the new logic
  using stored raw payloads.
- Deduplicating frontend/backend evaluation logic into a single source.
