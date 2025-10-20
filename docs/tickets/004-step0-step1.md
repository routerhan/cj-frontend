# 004 - Step0 歡迎頁與 Step1 基本資料表單

## Summary
- 建立引導式歡迎頁與基本資料表單，支援年齡、BMI 即時計算並同步更新 Context。

## why
- 起始頁與第一步的填寫體驗直接影響使用者是否願意完成整個流程，需要流暢且及時的反饋。

## Scope
- 在 `steps/Welcome.jsx` 實作歡迎頁，提供「立即開始評估」按鈕呼叫 `goToStep(1)`。
- 在 `steps/Step1_BasicInfo.jsx` 建立基本資料表單欄位（性別、出生年月日、國籍、身高、體重、腰圍）。
- 建立 `components/ui/Button.jsx` 與 `.module.css`，提供一致的按鈕樣式。
- 建立 `components/ui/InstantResult.jsx`，用於顯示 BMI、年齡等即時計算結果。
- 在 `utils/calculations.js` 實作年齡計算與 BMI 函式，含邏輯註解與單元測試。
- 將表單資料透過 `updateFormData` 寫回 Context，並於欄位輸入時自動計算年齡與 BMI。

## out of scope
- 不包含完成狀態判斷（可於後續整合票處理）。
- 不處理多語系或國籍選單的資料來源整合。

## Acceptance Criteria
- 歡迎頁按鈕可順利導向 Step1，且 Context 的 `currentStep` 更新。
- Step1 所有欄位雙向綁定 Context，重新造訪可看到已填寫的值。
- 當身高、體重皆填寫時即時計算 BMI 並顯示文字反饋（如「標準」、「過重」）。
- 年齡會根據出生年月日自動顯示於 `InstantResult`，並避免負值或未來日期。
- `calculations.js` 內的年齡與 BMI 函式皆有對應單元測試且通過。

## Implementation Steps
- 實作 `Welcome.jsx` UI 與按鈕邏輯，使用 `Button` 元件統一樣式。
- 開發 `InstantResult` 組件，用以顯示 label、數值與說明文字。
- 在 Step1 表單中建立受控欄位，撰寫事件處理函式自動更新 Context 與觸發計算。
- 撰寫 `calculateAge`, `calculateBMI`, `getBMICategory` 等函式並加上註解與匯出。
- 使用 Jest/RTL 撰寫對 BMI 與年齡的單元測試，跑 `npm run test` 確保通過。

## test/Validation
- 以瀏覽器實測：填寫欄位後確認年齡與 BMI 立即更新且分類文字正確。
- 執行 `npm run test`，確保 `calculations.test.js` 相關測試皆為綠色。
- 執行 `npm run lint`（如有設定）確保無語法或風格錯誤。
