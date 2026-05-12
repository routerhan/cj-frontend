# No-Risk Assessment Level Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Introduce a new `no_risk` ("無風險") risk-assessment level so that complete questionnaires with no triggered rules and zero risk factors are distinguished from incomplete-data submissions, which keep the narrowed `undefined` ("未定義") meaning.

**Architecture:** Both backend (`backend/app/services/risk_assessment.py`) and frontend (`src/utils/riskRules.js`) duplicate the evaluation logic and must be updated in parallel. The new fallback branch checks a fixed core-field list (`age`, `gender`, `systolic`, `diastolic`, `ldl_c`, `hdl_c`, `triglyceride`): all present → `no_risk`, any missing → `undefined`. Rule matches and non-zero factor counts always win over completeness checks.

**Tech Stack:** Python 3.12 (FastAPI, Pydantic v1, pytest), JavaScript (React 18, Vite, Vitest), CSS modules.

**Reference spec:** `docs/superpowers/specs/2026-05-12-no-risk-level-design.md`

---

## File Structure

**Backend (modified)**
- `backend/app/schemas/risk_assessment.py` — add `NO_RISK` enum value.
- `backend/app/services/risk_assessment.py` — add `_has_core_fields`, update title mapping, recommendations, and evaluate fallback.
- `backend/app/api/risk_assessment.py` — admin dashboard inline HTML/CSS/JS for chip label, color, filter button.
- `backend/tests/test_risk_service.py` — split and add tests.

**Frontend (modified)**
- `src/utils/riskRules.js` — add `NO_RISK`, `hasCoreFields`, recommendations, update evaluator.
- `src/utils/riskRules.test.js` — split and add tests.
- `src/steps/Step4_Report.jsx` — chip switch case, LDL target gating, judgement message branch.
- `src/steps/Step4_Report.module.css` — `.levelChipNoRisk` rule.
- `src/i18n/translations.js` — add `no_risk` entries (zh-Hant + en); update `undefined` texts.

No new files. No database migrations. No DB-level changes.

---

## Task 1: Add `NO_RISK` to backend enum

**Files:**
- Modify: `backend/app/schemas/risk_assessment.py:18-27`
- Test: `backend/tests/test_risk_service.py` (new test at end)

- [ ] **Step 1.1: Write the failing test**

Append to `backend/tests/test_risk_service.py`:

```python
def test_risk_level_code_enum_contains_no_risk():
    """NO_RISK enum value must exist with code 'no_risk'."""

    assert RiskLevelCodeEnum.NO_RISK.value == "no_risk"
```

- [ ] **Step 1.2: Run test to verify it fails**

Run: `cd backend && pytest tests/test_risk_service.py::test_risk_level_code_enum_contains_no_risk -v`
Expected: FAIL with `AttributeError: NO_RISK` (enum has no such member).

- [ ] **Step 1.3: Add the enum member**

In `backend/app/schemas/risk_assessment.py`, edit the `RiskLevelCodeEnum` class (around line 18-27). After the `LOW = "low"` line and before `UNDEFINED = "undefined"`, insert `NO_RISK = "no_risk"`:

```python
class RiskLevelCodeEnum(str, Enum):
    """API 回傳層級代碼，需與前端 `LEVEL_DESCRIPTION` 使用的鍵一致。"""

    EXTREMELY_HIGH = "extremely_high"
    VERY_HIGH = "very_high"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    NO_RISK = "no_risk"
    UNDEFINED = "undefined"
```

- [ ] **Step 1.4: Run test to verify it passes**

Run: `cd backend && pytest tests/test_risk_service.py::test_risk_level_code_enum_contains_no_risk -v`
Expected: PASS.

- [ ] **Step 1.5: Commit**

```bash
git add backend/app/schemas/risk_assessment.py backend/tests/test_risk_service.py
git commit -s -m "feat(schema): add NO_RISK level code to RiskLevelCodeEnum"
```

---

## Task 2: Backend `_has_core_fields` helper

**Files:**
- Modify: `backend/app/services/risk_assessment.py` (add helper above `class RiskAssessmentService`)
- Test: `backend/tests/test_risk_service.py` (new tests)

- [ ] **Step 2.1: Write the failing tests**

Append to `backend/tests/test_risk_service.py`:

```python
from app.services.risk_assessment import _has_core_fields


def test_has_core_fields_true_when_all_present():
    payload = _build_request()  # defaults include all seven core fields
    assert _has_core_fields(payload) is True


def test_has_core_fields_false_when_age_missing():
    payload = _build_request(age=None)
    assert _has_core_fields(payload) is False


def test_has_core_fields_false_when_systolic_missing():
    payload = _build_request(systolic=None)
    assert _has_core_fields(payload) is False


def test_has_core_fields_false_when_ldl_missing():
    payload = _build_request(ldl_c=None)
    assert _has_core_fields(payload) is False


def test_has_core_fields_false_when_gender_missing():
    payload = _build_request(gender=None)
    assert _has_core_fields(payload) is False
```

- [ ] **Step 2.2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_risk_service.py -k has_core_fields -v`
Expected: FAIL with `ImportError: cannot import name '_has_core_fields'`.

- [ ] **Step 2.3: Implement the helper**

In `backend/app/services/risk_assessment.py`, insert the helper just above `class RiskAssessmentService(RiskAssessmentServiceProtocol):` (around line 275):

```python
_CORE_FIELDS = ("age", "gender", "systolic", "diastolic", "ldl_c", "hdl_c", "triglyceride")


def _has_core_fields(payload: RiskAssessmentRequest) -> bool:
    """七個核心欄位皆有值才視為資料完整。"""

    return all(getattr(payload, name) is not None for name in _CORE_FIELDS)
```

- [ ] **Step 2.4: Run tests to verify they pass**

Run: `cd backend && pytest tests/test_risk_service.py -k has_core_fields -v`
Expected: 5 PASS.

- [ ] **Step 2.5: Commit**

```bash
git add backend/app/services/risk_assessment.py backend/tests/test_risk_service.py
git commit -s -m "feat(risk): add _has_core_fields helper for core completeness check"
```

---

## Task 3: Backend evaluate() — split fallback into NO_RISK / UNDEFINED

**Files:**
- Modify: `backend/app/services/risk_assessment.py:30-41` (title mapping), `:240-266` (RECOMMENDATIONS), `:330-334` (terminal branch)
- Modify: `backend/tests/test_risk_service.py:208-229` (rewrite existing `test_undefined_when_no_risk_factors`)

- [ ] **Step 3.1: Rewrite and extend the failing tests**

Replace the existing `test_undefined_when_no_risk_factors` function in `backend/tests/test_risk_service.py` (lines 208-229) with the three tests below:

```python
def test_no_risk_when_core_fields_complete_and_zero_factors(risk_service: RiskAssessmentService):
    """All seven core fields present, no rules match, zero factors → no_risk."""

    payload = _build_request(
        age=30,
        is_male=False,
        gender="female",
        has_hypertension=False,
        systolic=110,
        diastolic=70,
        hdl_c=60,
        ldl_c=90,
        triglyceride=90,
        waist_cm=70,
        fasting_glucose=85,
        metabolic_syndrome_factors=0,
        is_smoker=False,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.NO_RISK
    assert result.level == "無風險"
    assert result.matchedRules == []
    assert result.riskFactorCount == 0
    assert result.recommendations  # non-empty


def test_undefined_when_core_fields_missing(risk_service: RiskAssessmentService):
    """Core field missing (systolic), no rules match, zero factors → undefined."""

    payload = _build_request(
        age=30,
        is_male=False,
        gender="female",
        systolic=None,
        diastolic=70,
        hdl_c=60,
        ldl_c=90,
        triglyceride=90,
        metabolic_syndrome_factors=0,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.UNDEFINED
    assert result.matchedRules == []
    assert result.riskFactorCount == 0


def test_rule_match_wins_over_missing_core_fields(risk_service: RiskAssessmentService):
    """Rule still triggers even when a core field is missing."""

    payload = _build_request(
        has_ascvd_history=True,
        systolic=None,
        ldl_c=None,
        hdl_c=None,
        triglyceride=None,
    )

    result = risk_service.evaluate(payload)

    assert result.levelCode is RiskLevelCodeEnum.VERY_HIGH
    assert [rule.code for rule in result.matchedRules] == ["ascvd_history"]
```

- [ ] **Step 3.2: Run tests to verify they fail**

Run: `cd backend && pytest tests/test_risk_service.py::test_no_risk_when_core_fields_complete_and_zero_factors tests/test_risk_service.py::test_undefined_when_core_fields_missing tests/test_risk_service.py::test_rule_match_wins_over_missing_core_fields -v`
Expected: `test_no_risk_when_core_fields_complete_and_zero_factors` FAILs (level is currently UNDEFINED, not NO_RISK); `test_rule_match_wins_over_missing_core_fields` PASSes already; `test_undefined_when_core_fields_missing` PASSes already.

- [ ] **Step 3.3: Add `NO_RISK` to title mapping**

In `backend/app/services/risk_assessment.py`, edit `_title_by_code` (lines 30-41). Add `RiskLevelCodeEnum.NO_RISK: "無風險",` between the `LOW` and `UNDEFINED` rows:

```python
def _title_by_code(code: RiskLevelCodeEnum) -> str:
    """回傳與層級代碼對應的中文標籤。"""

    mapping: Dict[RiskLevelCodeEnum, str] = {
        RiskLevelCodeEnum.EXTREMELY_HIGH: "極高",
        RiskLevelCodeEnum.VERY_HIGH: "非常高",
        RiskLevelCodeEnum.HIGH: "高",
        RiskLevelCodeEnum.MEDIUM: "中",
        RiskLevelCodeEnum.LOW: "低",
        RiskLevelCodeEnum.NO_RISK: "無風險",
        RiskLevelCodeEnum.UNDEFINED: "未定義",
    }
    return mapping[code]
```

- [ ] **Step 3.4: Add `NO_RISK` recommendations and refine `UNDEFINED` text**

In `backend/app/services/risk_assessment.py`, locate the `RECOMMENDATIONS` dict (around lines 240-266). Insert `NO_RISK` block before `UNDEFINED`, and replace the `UNDEFINED` block with the data-incomplete wording:

```python
    RiskLevelCodeEnum.NO_RISK: [
        "維持目前健康生活型態，包含規律運動、均衡飲食、不抽菸",
        "建議每 1-2 年定期回檢血壓、血脂與基本血液檢查",
    ],
    RiskLevelCodeEnum.UNDEFINED: [
        "評估所需的基本資料尚未填寫完整，請補齊年齡、性別、血壓、血脂後重新評估",
    ],
}
```

- [ ] **Step 3.5: Update the evaluate() terminal branch**

In `backend/app/services/risk_assessment.py`, replace lines 330-334 (the trailing `level_code = RiskLevelCodeEnum.UNDEFINED` block at the end of `evaluate`):

```python
        if _has_core_fields(payload):
            level_code = RiskLevelCodeEnum.NO_RISK
        else:
            level_code = RiskLevelCodeEnum.UNDEFINED
        response = self._build_response(
            level_code, risk_factor_count, risk_factors, metabolic_result, []
        )
        return self._finalize_response(payload, response)
```

- [ ] **Step 3.6: Run all backend service tests**

Run: `cd backend && pytest tests/test_risk_service.py -v`
Expected: All tests PASS, including the three from Step 3.1.

- [ ] **Step 3.7: Commit**

```bash
git add backend/app/services/risk_assessment.py backend/tests/test_risk_service.py
git commit -s -m "feat(risk): split fallback into no_risk / undefined by core-field check"
```

---

## Task 4: Backend admin dashboard — chip label/color/filter

**Files:**
- Modify: `backend/app/api/risk_assessment.py:122-128` (CSS variables), `:193-198` (chip CSS), `:276-283` (filter chips), `:319-335` (LEVEL_LABELS / LEVEL_COLORS), `:549` (order array)

The admin dashboard is server-rendered inline HTML — there is no unit test harness for it. Manual verification is performed at the end (Task 9).

- [ ] **Step 4.1: Add `--teal` CSS variable**

In `backend/app/api/risk_assessment.py`, line 127 currently has the green color block. Append teal after the gray block (around line 128):

```python
  --green:#059669;--green-bg:rgba(5,150,105,0.08);
  --teal:#0d9488;--teal-bg:rgba(13,148,136,0.08);
  --gray:#6b7280;--gray-bg:rgba(107,114,128,0.08);
```

(Teal is used so `no_risk` is visually distinct from `low`, which already uses `--green`.)

- [ ] **Step 4.2: Add the `.chip.no_risk` rule**

In `backend/app/api/risk_assessment.py`, around line 197 the chip CSS lives. Insert the `no_risk` rule between `low` and `undefined`:

```python
.chip.low{background:var(--green-bg);color:var(--green)}
.chip.no_risk{background:var(--teal-bg);color:var(--teal)}
.chip.undefined{background:var(--gray-bg);color:var(--gray)}
```

- [ ] **Step 4.3: Add the filter-chip button**

In `backend/app/api/risk_assessment.py`, around line 282 the filter buttons are listed. Insert a `no_risk` button between `low` and the closing div:

```html
        <button class="filter-chip" data-level="low">低</button>
        <button class="filter-chip" data-level="no_risk">無風險</button>
        <button class="filter-chip" data-level="undefined">未定義</button>
```

(Verify that an `undefined` filter button already exists in the source around line 283; if not, add it as shown so admins can still filter legacy `undefined` records.)

- [ ] **Step 4.4: Update `LEVEL_LABELS` and `LEVEL_COLORS`**

In `backend/app/api/risk_assessment.py`, around lines 319-335 replace the two dictionaries:

```javascript
var LEVEL_LABELS = {
  extremely_high: '極高',
  very_high: '非常高',
  high: '高',
  medium: '中',
  low: '低',
  no_risk: '無風險',
  undefined: '未定義'
};

var LEVEL_COLORS = {
  extremely_high: 'var(--red)',
  very_high: 'var(--orange)',
  high: 'var(--amber)',
  medium: 'var(--blue)',
  low: 'var(--green)',
  no_risk: 'var(--teal)',
  undefined: 'var(--gray)'
};
```

- [ ] **Step 4.5: Update the chip-order array**

In `backend/app/api/risk_assessment.py`, line 549 currently:

```javascript
  var order = ['extremely_high','very_high','high','medium','low','undefined'];
```

Insert `'no_risk'` between `'low'` and `'undefined'`:

```javascript
  var order = ['extremely_high','very_high','high','medium','low','no_risk','undefined'];
```

- [ ] **Step 4.6: Smoke-check the file parses**

Run: `cd backend && python -c "from app.api.risk_assessment import router; print('ok')"`
Expected: prints `ok` with no syntax errors.

- [ ] **Step 4.7: Commit**

```bash
git add backend/app/api/risk_assessment.py
git commit -s -m "feat(admin): render no_risk chip with teal accent in dashboard"
```

---

## Task 5: Frontend `riskRules.js` — RiskLevels, hasCoreFields, evaluator

**Files:**
- Modify: `src/utils/riskRules.js:1-8` (`RiskLevels`), `:193-218` (`RECOMMENDATIONS`), `:225-348` (evaluator)
- Modify: `src/utils/riskRules.test.js:125-146` (existing zero-factor test), add new tests

- [ ] **Step 5.1: Rewrite and extend the failing tests**

In `src/utils/riskRules.test.js`, replace the existing `it('風險因子為零時回傳未定義層級', ...)` block (lines 125-146) with three blocks:

```javascript
  it('核心欄位齊全且風險因子為零時回傳 no_risk', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        age: 30,
        is_male: false,
        gender: 'female',
        has_hypertension: false,
        systolic: 110,
        diastolic: 70,
        hdl_c: 60,
        ldl_c: 90,
        waist_cm: 70,
        fasting_glucose: 85,
        triglyceride: 90,
        is_smoker: false,
        metabolic_syndrome_factors: 0,
      }),
    )

    expect(result.levelCode).toBe('no_risk')
    expect(result.level).toBe('無風險')
    expect(result.matchedRules).toEqual([])
    expect(result.riskFactorCount).toBe(0)
  })

  it('核心欄位缺漏時回傳 undefined', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        age: 30,
        is_male: false,
        gender: 'female',
        systolic: null,
        diastolic: 70,
        hdl_c: 60,
        ldl_c: 90,
        triglyceride: 90,
        metabolic_syndrome_factors: 0,
      }),
    )

    expect(result.levelCode).toBe('undefined')
    expect(result.matchedRules).toEqual([])
  })

  it('規則命中優先於核心欄位完整性', () => {
    const result = evaluateRiskAssessment(
      makeInput({
        has_ascvd_history: true,
        systolic: null,
        ldl_c: null,
        hdl_c: null,
        triglyceride: null,
      }),
    )

    expect(result.levelCode).toBe('very_high')
    expect(extractCodes(result.matchedRules)).toEqual(['ascvd_history'])
  })
```

- [ ] **Step 5.2: Run tests to verify they fail**

Run: `npx vitest run src/utils/riskRules.test.js`
Expected: `核心欄位齊全且風險因子為零時回傳 no_risk` FAILs (current behavior returns `undefined`). Other two PASS.

- [ ] **Step 5.3: Add `NO_RISK` to `RiskLevels`**

In `src/utils/riskRules.js`, edit lines 1-8 to insert `NO_RISK` between `LOW` and `UNDEFINED`:

```javascript
const RiskLevels = {
  EXTREMELY_HIGH: { code: 'extremely_high', label: '極高' },
  VERY_HIGH: { code: 'very_high', label: '非常高' },
  HIGH: { code: 'high', label: '高' },
  MEDIUM: { code: 'medium', label: '中' },
  LOW: { code: 'low', label: '低' },
  NO_RISK: { code: 'no_risk', label: '無風險' },
  UNDEFINED: { code: 'undefined', label: '未定義' },
}
```

- [ ] **Step 5.4: Add `hasCoreFields` helper**

In `src/utils/riskRules.js`, insert just below the `buildMatch` helper (around line 22):

```javascript
const CORE_FIELDS = ['age', 'gender', 'systolic', 'diastolic', 'ldl_c', 'hdl_c', 'triglyceride']

const hasCoreFields = (input) =>
  CORE_FIELDS.every((field) => input[field] !== null && input[field] !== undefined && input[field] !== '')
```

- [ ] **Step 5.5: Update `RECOMMENDATIONS`**

In `src/utils/riskRules.js`, locate the `RECOMMENDATIONS` object (lines 193-218). Insert `no_risk` before `undefined` and replace `undefined` text:

```javascript
  no_risk: [
    '維持目前健康生活型態，包含規律運動、均衡飲食、不抽菸',
    '建議每 1-2 年定期回檢血壓、血脂與基本血液檢查',
  ],
  undefined: ['評估所需的基本資料尚未填寫完整，請補齊年齡、性別、血壓、血脂後重新評估'],
}
```

- [ ] **Step 5.6: Update the evaluator terminal branch**

In `src/utils/riskRules.js`, replace the final `return { ... UNDEFINED ... }` block (lines 338-347 in current file) with:

```javascript
  const fallbackLevel = hasCoreFields(input) ? RiskLevels.NO_RISK : RiskLevels.UNDEFINED

  return {
    level: fallbackLevel.label,
    levelCode: fallbackLevel.code,
    matchedRules: [],
    riskFactorCount,
    riskFactors,
    metabolicSyndrome: metabolicDetails,
    recommendations: RECOMMENDATIONS[fallbackLevel.code],
    evaluatedAt: new Date().toISOString(),
  }
}
```

- [ ] **Step 5.7: Run tests to verify they pass**

Run: `npx vitest run src/utils/riskRules.test.js`
Expected: all tests PASS, including the three from Step 5.1.

- [ ] **Step 5.8: Commit**

```bash
git add src/utils/riskRules.js src/utils/riskRules.test.js
git commit -s -m "feat(risk): add no_risk level and hasCoreFields gate in frontend evaluator"
```

---

## Task 6: Frontend `Step4_Report.jsx` — chip class + judgement branch + LDL target

**Files:**
- Modify: `src/steps/Step4_Report.jsx:166-203` (judgement + level description) and `:313-328` (chip switch)

- [ ] **Step 6.1: Update LDL target gating**

In `src/steps/Step4_Report.jsx` line 168, current code reads:

```javascript
const showLdlTarget = report.levelCode && report.levelCode !== 'undefined'
```

Replace with:

```javascript
const showLdlTarget =
  report.levelCode && report.levelCode !== 'undefined' && report.levelCode !== 'no_risk'
```

- [ ] **Step 6.2: Update judgement branch for no_risk**

In `src/steps/Step4_Report.jsx` line 173, current code reads:

```javascript
    if (report.levelCode === 'undefined' || !report.levelCode) {
      return {
        message: labels.noRiskCondition ?? 'No matching cardiovascular risk conditions detected.',
        items: [],
      }
    }
```

Replace with:

```javascript
    if (!report.levelCode || report.levelCode === 'undefined') {
      return {
        message: labels.incompleteData ?? 'Insufficient data: please complete age, gender, blood pressure, and lipid measurements.',
        items: [],
      }
    }
    if (report.levelCode === 'no_risk') {
      return {
        message: labels.noRiskCondition ?? 'No matching cardiovascular risk conditions detected.',
        items: [],
      }
    }
```

- [ ] **Step 6.3: Add `no_risk` case to the chip switch**

In `src/steps/Step4_Report.jsx` lines 313-328, the `summaryHighlight` switch lacks `no_risk`. Insert a case between `low` and the default:

```javascript
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
      case 'no_risk':
        return styles.levelChipNoRisk
      default:
        return styles.levelChipNeutral
    }
  })()
```

- [ ] **Step 6.4: Smoke-check the build**

Run: `npx vite build` (or `npm run build` if defined)
Expected: build completes without errors. (If `vite build` fails for unrelated reasons in this environment, fall back to `npx vitest run src/steps` to confirm the report tests still pass.)

- [ ] **Step 6.5: Commit**

```bash
git add src/steps/Step4_Report.jsx
git commit -s -m "feat(report): render no_risk and incomplete-data branches in Step4 report"
```

---

## Task 7: Frontend CSS — `.levelChipNoRisk`

**Files:**
- Modify: `src/steps/Step4_Report.module.css` (after the `.levelChipLow` block around line 143)

- [ ] **Step 7.1: Add the new chip class**

In `src/steps/Step4_Report.module.css`, just after the `.levelChipLow` block (line 144) and before `.levelChipNeutral`:

```css
.levelChipNoRisk {
  background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
  color: #ecfeff;
}
```

- [ ] **Step 7.2: Commit**

```bash
git add src/steps/Step4_Report.module.css
git commit -s -m "style(report): add teal chip style for no_risk level"
```

---

## Task 8: Frontend i18n — zh-Hant and en blocks

**Files:**
- Modify: `src/i18n/translations.js:381-419` (zh-Hant `report` block) and `:438-463` (zh-Hant recommendations); `:938-976` (en `report` block) and `:994-1020` (en recommendations).

- [ ] **Step 8.1: Update zh-Hant `levelDescription`**

In `src/i18n/translations.js` lines 381-388, replace the block with:

```javascript
      levelDescription: {
        extremely_high: '屬於最高優先等級，建議立即與專業醫療團隊討論侵入性治療與用藥策略。',
        very_high: '已確診 ASCVD 或顯著斑塊負擔，需密集追蹤並調整危險因子。',
        high: '具備重大慢性病或高危險生化指標，請積極管理血脂、血壓與血糖。',
        medium: '累積多項心血管危險因子，應加強生活型態並定期追蹤。',
        low: '目前僅具備單一心血管危險因子，建議持續維護健康習慣。',
        no_risk: '目前未偵測到特定心血管風險條件，請持續維持健康作息並定期追蹤。',
        undefined: '評估所需的基本資料尚未填寫完整，請補齊年齡、性別、血壓與血脂後重新評估。',
      },
```

- [ ] **Step 8.2: Update zh-Hant `ldlTargets`**

Lines 389-396:

```javascript
      ldlTargets: {
        extremely_high: '<55 mg/dL',
        very_high: '<70 mg/dL',
        high: '<100 mg/dL',
        medium: '<115 mg/dL',
        low: '<130 mg/dL',
        no_risk: '維持目前範圍即可',
        undefined: '請補齊基本資料以取得個人化建議',
      },
```

- [ ] **Step 8.3: Update zh-Hant `levelLabels`**

Lines 412-419:

```javascript
      levelLabels: {
        extremely_high: '極高',
        very_high: '非常高',
        high: '高',
        medium: '中',
        low: '低',
        no_risk: '無風險',
        undefined: '未定義',
      },
```

- [ ] **Step 8.4: Update zh-Hant `recommendations`**

In `src/i18n/translations.js` lines 437-464, the `undefined` array currently says "資料不足以評估...". Insert a `no_risk` entry and replace the `undefined` entry:

```javascript
        no_risk: [
          '維持目前健康生活型態，包含規律運動、均衡飲食、不抽菸',
          '建議每 1-2 年定期回檢血壓、血脂與基本血液檢查',
        ],
        undefined: [
          '評估所需的基本資料尚未填寫完整，請補齊年齡、性別、血壓、血脂後重新評估',
        ],
      },
```

- [ ] **Step 8.5: Add zh-Hant `labels.incompleteData`**

In `src/i18n/translations.js`, locate the `labels` block inside the zh-Hant `report` object (after the `recommendations` block, look for `labels:` — if absent, add it). Ensure it has `incompleteData` key:

```javascript
        incompleteData: '資料不齊全：請補齊年齡、性別、血壓與血脂後重新評估',
```

If a `labels` block doesn't already exist in zh-Hant, locate by searching `labels:` near `noRiskCondition:` (it should already exist). Add `incompleteData` adjacent to `noRiskCondition`.

- [ ] **Step 8.6: Mirror updates in the en block**

In `src/i18n/translations.js` lines 938-1020 (en `report` block):

```javascript
      levelDescription: {
        extremely_high: 'Top priority level. Consult a medical team immediately to discuss invasive treatment and medication strategies.',
        very_high: 'Confirmed ASCVD or significant plaque burden. Intensive follow-up and risk factor adjustment required.',
        high: 'Major chronic conditions or high-risk biomarkers present. Actively manage lipids, blood pressure, and glucose.',
        medium: 'Multiple cardiovascular risk factors accumulated. Strengthen lifestyle changes and regular monitoring.',
        low: 'Only a single cardiovascular risk factor present. Continue maintaining healthy habits.',
        no_risk: 'No specific cardiovascular risk conditions detected. Maintain a healthy routine and regular check-ups.',
        undefined: 'Insufficient data: please complete age, gender, blood pressure, and lipid measurements before re-evaluation.',
      },
      ldlTargets: {
        extremely_high: '<55 mg/dL',
        very_high: '<70 mg/dL',
        high: '<100 mg/dL',
        medium: '<115 mg/dL',
        low: '<130 mg/dL',
        no_risk: 'Maintain current range',
        undefined: 'Complete the required information to receive personalized targets',
      },
```

And for `levelLabels` (lines 969-976):

```javascript
      levelLabels: {
        extremely_high: 'Extremely High',
        very_high: 'Very High',
        high: 'High',
        medium: 'Moderate',
        low: 'Low',
        no_risk: 'No Risk',
        undefined: 'Undefined',
      },
```

And for `recommendations` (replace `undefined` block around 1018-1020 and insert `no_risk` before it):

```javascript
        no_risk: [
          'Maintain current healthy lifestyle, including regular exercise, balanced diet, and not smoking',
          'Re-check BP, lipids, and basic blood work every 1-2 years',
        ],
        undefined: [
          'Insufficient data for assessment: please complete age, gender, blood pressure, and lipids before re-evaluation',
        ],
```

And the en `labels.incompleteData`:

```javascript
        incompleteData: 'Insufficient data: please complete age, gender, blood pressure, and lipid measurements.',
```

- [ ] **Step 8.7: Run frontend tests**

Run: `npx vitest run`
Expected: all tests PASS. (Translation changes are not directly asserted but no test should regress.)

- [ ] **Step 8.8: Commit**

```bash
git add src/i18n/translations.js
git commit -s -m "feat(i18n): add no_risk strings and narrow undefined to incomplete data"
```

---

## Task 9: Manual verification

**Files:** none modified — verification only.

- [ ] **Step 9.1: Start the dev server**

Run: `npm run dev` in one terminal, and `cd backend && uvicorn app.main:app --reload` in another. Confirm both come up without errors.

- [ ] **Step 9.2: Scenario A — full healthy profile**

In the browser, walk Step1–Step5 with a healthy profile (e.g. 30-year-old female, BP 110/70, LDL 90, HDL 60, TG 90, no diabetes/CKD/family history/smoking, no boxes ticked in Step5).
Expected: report page shows "無風險" (Chinese) / "No Risk" (English) with the teal chip style. No LDL target row. Judgement reads "No matching cardiovascular risk conditions detected."

- [ ] **Step 9.3: Scenario B — incomplete core fields**

Fill only Step1 birthDate + sex; skip Step2 BP/lipids; complete the rest minimally.
Expected: report shows "未定義" / "Undefined" with the neutral gray chip. Judgement reads the incomplete-data message. No LDL target row.

- [ ] **Step 9.4: Scenario C — rule wins despite missing data**

In Step5, tick "ASCVD history" but leave Step2 blank.
Expected: report shows "非常高" / "Very High" with the orange-red chip. ASCVD rule is listed.

- [ ] **Step 9.5: Scenario D — admin dashboard**

Log into the admin dashboard, submit a new no-risk assessment via the questionnaire, then refresh. Confirm:
- A new "無風險" filter button appears between "低" and "未定義".
- The new record shows a teal chip in the table.
- Level distribution chart now has a teal segment.
- Existing legacy `undefined` rows are unchanged.

- [ ] **Step 9.6: Document any regressions and (if any) fix + commit**

If a regression is found, return to the relevant task, write a new failing test, fix, commit. Otherwise note "manual verification clean" and proceed.

---

## Self-Review Notes

**Spec coverage:**
- Enum addition → Task 1 ✓
- `_has_core_fields` helper (both sides) → Tasks 2, 5 ✓
- Service evaluate() split → Task 3 ✓
- Admin dashboard chip / color / filter / order → Task 4 ✓
- Frontend evaluator split → Task 5 ✓
- Step4_Report chip + LDL target + judgement → Task 6 ✓
- CSS for new chip → Task 7 ✓
- i18n (both zh-Hant and en) → Task 8 ✓
- Tests rewritten (zero-factor split + rule-wins) → Tasks 3, 5 ✓
- Manual QA checklist → Task 9 ✓
- Historical data untouched → no migration tasks ✓

**Naming consistency check:**
- Backend enum: `RiskLevelCodeEnum.NO_RISK` with value `"no_risk"` (snake_case) — used as DB string and over the wire.
- Frontend: `RiskLevels.NO_RISK.code === 'no_risk'` — matches.
- CSS classes: `.chip.no_risk` (backend HTML) and `.levelChipNoRisk` (frontend module) — different because frontend uses camelCase module classes by convention. Confirmed consistent within each file.
- Helper names: `_has_core_fields` (Python snake_case) and `hasCoreFields` (JS camelCase) — matches each language's idiom.

**No placeholders detected.** All steps have concrete code and exact paths.
