# 005 - Step2 生活習慣與家族史表單

## Summary
- 完成生活習慣、家族史表單頁面，並加入 Tooltip 說明與 Context 同步。

## why
- 此步驟收集關鍵的生活與家族風險因子，需要清楚的互動提示來提升填寫正確性。

## Scope
- 在 `steps/Step2_Lifestyle.jsx` 實作表單欄位：抽煙、家族史、過去是否發生心血管疾病。
- 建立 `components/ui/Tooltip.jsx` 與 `.module.css`，支援滑鼠與鍵盤焦點顯示說明文字。
- 將 Tooltip 套用於家族史 `(i)` 圖示，顯示指定的說明文案。
- 建立對應的 CSS Modules，確保行動裝置上表單仍易於操作。
- 將表單資料透過 Context 的 `updateFormData` 寫回，並可根據選項控制「下一步」按鈕啟用狀態。

## out of scope
- 不處理 API 送出或後端序列化格式。
- 不實作進階的表單驗證（僅基本的必填檢查即可）。

## Acceptance Criteria
- Step2 所有欄位均為受控元件，重新開啟時能顯示先前填入的資料。
- Tooltip 在滑鼠 hover 或鍵盤 focus 時顯示且可被螢幕閱讀器讀取（使用 ARIA 屬性）。
- 表單資料變更後 `stepStatus` 可更新為 `in_progress` 或 `completed`（依 Context 規則）。
- 行動裝置上 Tooltip 仍可透過點擊觸發（或提供替代說明）。
- Step2 可正常導向下一步且不影響既有步驟。

## Implementation Steps
- 建立 `Tooltip.jsx`，處理顯示狀態、ARIA 屬性與 keyboard event。
- 實作 Step2 表單欄位與選項（可使用 radio button 或 select），並與 Context 綁定。
- 將 Tooltip 套用於家族史標籤旁 `(i)` 圖示，測試 hover/focus 行為。
- 完成 CSS Modules，確保欄位排版與響應式布局符合設計。
- 增加簡易測試：至少檢查 Tooltip 發生時 DOM 內容出現，以及表單更新後 Context 狀態變化。

## test/Validation
- 執行 Storybook 或開發模式手動操作 Tooltip 與表單，確認無 console 警告。
- 執行 `npm run test`（若加入測試）或記錄手動測試步驟，確保 Tooltip 可被鍵盤操作。
- 以 Chrome DevTools 模擬行動裝置，確認 Tooltip 與表單排版不破版。
