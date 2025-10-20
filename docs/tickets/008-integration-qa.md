# 008 - 全流程整合與品質驗證

## Summary
- 統整所有步驟、版型與工具函式，完成跨步驟導覽、狀態更新與最終體驗的整體驗證。

## why
- 確保各開發階段產出的功能能夠協同運作，並提前發現跨模組整合問題。

## Scope
- 在 `App.jsx` 或集中路由中根據 `currentStep` 渲染對應步驟頁面，並處理步驟切換。
- 整合 `stepStatus` 更新邏輯（例如完成必填欄位後標記已完成，返回修改時更新狀態）。
- 將所有 CSS Modules 與共用元件串接，修正視覺細節、對齊與動線一致性。
- 建立基本的表單驗證（至少阻止未填完直接進入下一步），並顯示友善錯誤訊息。
- 撰寫或更新整體的手動測試腳本，以及關鍵端對端（E2E）或整合測試（可用 Playwright/Cypress 或 RTL）。
- 校對所有文件（含 plan、tickets）是否對齊最終實作。

## out of scope
- 不實作實際的後端提交或資料儲存。
- 不優化 Lighthouse 分數以外的微調性能。

## Acceptance Criteria
- 使用者可從 Step0 順利完成至 Step4，所有步驟狀態顯示正確，Sidebar/MobileStepper 隨時更新。
- 未完成必填欄位時，無法進入下一步，並顯示清楚的提示。
- 所有 CSS Modules 維持響應式要求（桌機雙欄、手機單欄），無明顯佈局錯誤。
- 整合測試或自動化測試腳本至少覆蓋：成功填寫全流程、缺漏欄位警示、重新編輯已完成步驟。
- 專案可成功執行 `npm run build` 與（如有設定）`npm run lint`、`npm run test`。

## Implementation Steps
- 實作或調整中央 `StepRenderer`，依 Context 的 `currentStep` 載入對應元件。
- 建立跨步驟的驗證邏輯，於 Context 或各步驟中回報完成狀態。
- 全面檢視 CSS Modules，修正響應式斷點、間距與字體設定，使體驗一致。
- 撰寫整合測試腳本（建議使用 React Testing Library 或 Cypress）覆蓋核心互動。
- 更新 README 或專案說明，記錄執行開發伺服器、測試與建置的流程。

## test/Validation
- 執行 `npm run test`（含整合測試）並確保全部通過。
- 執行 `npm run build` 驗證生產環境建置成功。
- 手動操作完整流程並紀錄螢幕錄影或測試報告，確認沒有阻塞性問題。
