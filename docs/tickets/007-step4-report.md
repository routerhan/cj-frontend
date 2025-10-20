# 007 - Step4 風險報告與模擬 API

## Summary
- 建立風險報告頁面，串接模擬 API 計算，並顯示風險百分比、等級與建議。

## why
- 報告頁是整個流程的成果，需提供專業可信賴的資訊並維持流暢體驗（含載入動畫）。

## Scope
- 在 `utils/mockApi.js` 實作 `calculateRisk(formData)`，內含 1.5 秒延遲與風險隨機計算邏輯。
- 建立 `components/ui/LoadingSpinner.jsx` 與 `.module.css`，提供載入動畫。
- 在 `steps/Step4_Report.jsx` 呼叫 `calculateRisk`，顯示風險百分比、等級、主要風險因子列表與 CTA。
- 加入簡易視覺化（可用 CSS 或簡易圖表）比較使用者風險與同齡健康者。
- 報告頁提供 [下載 PDF 報告] 按鈕（按鈕無需實作功能，但需有明顯樣式）。
- 根據 API 結果更新 Context 的風險資料，以便未來擴充。

## out of scope
- 不整合真實後端或 PDF 產生器。
- 不實作多語系或使用者自訂報告文字。

## Acceptance Criteria
- 進入 Step4 時會顯示 LoadingSpinner，待 `calculateRisk` resolve 後呈現報告內容。
- 報告內含：百分比（例如 12.5%）、風險等級文字、主要風險因子列表、視覺化比較與 CTA 按鈕。
- 視覺化可使用簡單的條狀圖或儀表圖表示使用者 vs 參考值。
- `mockApi.js` 單元測試或偵測程式確認延遲後會回傳風險值與等級。
- 報告頁支援重新計算（例如重新點擊按鈕時再呼叫 API）。

## Implementation Steps
- 實作 `calculateRisk`，包含延遲、風險亂數產生與等級判定（低/中/高）。
- 建立 LoadingSpinner 元件，使用 CSS Modules 建構圓形旋轉動畫。
- 在 Step4 頁面使用 `useEffect` 或觸發函式呼叫 API，處理 loading 與錯誤狀態。
- 建構報告版面：顯示核心數值、文字敘述、主要因子列表與 CTA 區塊。
- 實作視覺化比較（可用純 CSS 條圖），確保行動裝置呈現良好。
- 撰寫單元測試或 mock 測試，確保 API 延遲與結果格式正確，並驗證報告渲染。

## test/Validation
- 執行 `npm run test`，確認 `mockApi` 相關測試通過。
- 手動於瀏覽器測試：重新整理與再次觸發計算，確保狀態切換正確且無錯誤訊息。
- 使用 DevTools 模擬行動裝置，檢查報告版面與 CTA 按鈕可視性。
