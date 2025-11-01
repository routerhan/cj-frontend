## Summary
實作第三步「糖尿病」的漸進式問答流程，蒐集診斷、用藥與空腹血糖值，維持低干擾的填寫體驗。

## Why
糖尿病是高風險與極高風險的核心因子，需要依客戶需求採漸進式揭露，避免對非患者造成壓力。

## Scope
- 將 Step3 調整為：是否被診斷糖尿病 →（若否）是否使用糖尿病藥物 →（若仍否）輸入空腹血糖值。
- 前端僅顯示欄位與必要說明，不需呈現即時指標提示；資料寫回 context 中的 diabetes 區段。

## Out-of-Scope
- 代謝症候群條件判斷與風險等級計算（由後端票處理）。
- UI 之外的流程（例如報告頁呈現）。

## Acceptance Criteria
- Step3 僅在使用者回答上一題為「否」時才揭露下一題，符合 rework.md 設定。
- 表單無即時指標提示，但所有輸入可寫入 context，重新進入此步驟時保留原輸入並可修改。

## Implementation Steps
1. 重新設計 Step3 component 的 state 與欄位顯示條件，實作漸進式揭露邏輯。
2. 連接 context 的新欄位（`hasDiabetesDiagnosis`, `usingDiabetesMeds`, `fastingGlucoseMgDl` 等）。
3. 新增/更新 component 測試涵蓋三層邏輯與資料流。

## Test/Validation
- 撰寫互動測試，驗證不同回答順序下欄位顯示與資料寫入是否符合預期。
- 手動測試確保返回此步驟時資料能回填。

Git commit message: refine step3 diabetes flow
