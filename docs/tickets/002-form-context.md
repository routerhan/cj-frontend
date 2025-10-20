# 002 - 建立 FormContext 與步驟管理

## Summary
- 建立集中化的 `FormContext` 與 Provider，負責儲存各步驟表單資料、步驟狀態與導頁控制。

## why
- 共享的狀態容器能確保跨步驟資料一致，並讓元件階層更易於測試與維護。

## Scope
- 在 `src/context/FormContext.jsx` 實作 `FormProvider`，包含 `formData`, `currentStep`, `stepStatus` 等核心 state 與更新函式。
- 定義表單資料的初始結構，覆蓋所有步驟會使用的欄位。
- 實作導頁控制函式（例如 `goToStep`, `goToNext`, `goToPrevious`）與步驟完成狀態更新邏輯。
- 暴露 `useFormContext` 自訂 hook，提供元件安全取得 Context。
- 於 `App.jsx` 內使用 `FormProvider` 包裹主要版型，注入 `steps` 中央設定（步驟標題、順序）。

## out of scope
- 不撰寫實際步驟頁面的 UI 與表單欄位。
- 不處理最終報告計算或 API 呼叫。

## Acceptance Criteria
- `FormContext.jsx` 匯出 `FormProvider` 與 `useFormContext`，並附帶 PropTypes 或型別註解（如有必要）。
- `formData` 具備所有步驟所需欄位的初始值，更新函式可同時支援局部與整體更新。
- 呼叫 `goToStep` 時會驗證目標步驟在有效範圍內，並更新 `currentStep`。
- `stepStatus` 至少包含 `pending`, `in_progress`, `completed` 三種狀態管理。
- `App.jsx` 綁定 Context，確保任一子元件都可透過 `useFormContext` 取得資料。

## Implementation Steps
- 在 `src/context` 建立 `FormContext.jsx`，定義 `FormContext = createContext()` 與 `FormProvider`。
- 寫出初始 state 結構與更新函式（`setFormData`, `setCurrentStep`, `setStepStatus` 等）。
- 加入 Context value（含 `steps` 設定、導航函式），並撰寫 `useFormContext` 確保 Context 不為 `undefined`。
- 調整 `App.jsx` 將 `Layout` 或後續元件包裹在 `FormProvider` 中。
- 撰寫基本單元測試或 React Testing Library 測試，驗證 `goToNext` 與資料更新函式的行為（至少要有測試計畫）。

## test/Validation
- 撰寫並執行 `npm run test`（或新增 `FormContext` 專屬測試）驗證狀態更新邏輯。
- 手動在開發模式下建立暫時性範例元件，印出 Context 值與更新行為，確認沒有 React Context 錯誤。
