## Summary
重新設計表單資料結構與步驟設定，支援新的先易後難流程與計算欄位。

## Why
客戶希望以「收集獨立事實、後端嚴謹分類」為核心，原有資料模型與步驟定義無法對應新題目與即時計算需求。

## Scope
- 更新 `FormContext` 的初始 state 與 `steps` 定義，使流程依序為：基本資料 → 血壓與血脂 → 糖尿病 → 腎臟病 → 心血管病史。
- 加入新的欄位（出生年月日、腰圍、用藥狀態、病史等），並提供 helper 計算年齡、BMI 與性別對應判斷所需資訊。
- 讓 context 提供即時回傳欄位（ageInYears、bmi、waistIsObese 等）供各步驟使用。

## Out-of-Scope
- 不處理任何 UI 呈現或提示文字。
- 不變更風險報告版面或後端風險邏輯。

## Acceptance Criteria
- `useFormContext()` 暴露的 `formData` 包含 rework.md 列出的所有新事實欄位。
- `steps` 順序與名稱符合新流程，狀態管理（IN_PROGRESS、COMPLETED 等）仍可運作。
- Context 提供 `getAge`, `getBmi`, `getWaistStatus` 等 helper，其他步驟可用來驅動即時提示。

## Implementation Steps
1. 調整 `FormContext` 內的初始 `formData`，加入所有新欄位並移除不再使用的欄位。
2. 重新定義 `steps` 陣列及與 `StepStatus` 相關的初始化邏輯，確保流程順序符合 rework.md。
3. 實作 memoized helper（例如 `useMemo` 或 selector 函式）計算年齡、BMI、性別門檻等資訊並曝露給 context consumer。
4. 更新 context 測試或新增單元測試，驗證新 helper 與 step 狀態行為。

## Test/Validation
- 撰寫/更新 unit tests 確認 `FormContext` 初始值、步驟順序與 helper 計算結果正確。
- 使用 Storybook 或現有 Step 元件手動驗證，context 仍能驅動既有流程。

Git commit message: refactor form context
