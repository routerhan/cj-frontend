## Summary
實作第三步「糖尿病」的漸進式問答流程，蒐集診斷、用藥與空腹血糖值並提供提示。

## Why
糖尿病是高風險與極高風險的核心因子，需要依客戶需求採漸進式揭露，避免對非患者造成壓力。

## Scope
- 將 Step3 調整為：是否被診斷糖尿病 →（若否）是否使用糖尿病藥物 →（若仍否）輸入空腹血糖值。
- 血糖欄位需提供即時提示（≥100 mg/dL）。
- 對應的欄位資料寫回 context 中的 diabetes 區段。

## Out-of-Scope
- 代謝症候群條件判斷與風險等級計算（由後端票處理）。
- UI 之外的流程（例如報告頁呈現）。

## Acceptance Criteria
- Step3 僅在使用者回答上一題為「否」時才揭露下一題，符合 rework.md 設定。
- 當血糖值≥100 時顯示偏高提示。
- 重新進入此步驟時保留原先輸入，並可修改更新。

## Implementation Steps
1. 重新設計 Step3 component 的 state 與欄位顯示條件，實作漸進式揭露邏輯。
2. 加入血糖即時提示與必要的輸入驗證。
3. 連接 context 的新欄位（`hasDiabetesDiagnosis`, `usingDiabetesMeds`, `fastingGlucoseMgDl` 等）。
4. 新增/更新 component 測試涵蓋三層邏輯與提示顯示。

## Test/Validation
- 撰寫互動測試，驗證不同回答順序下欄位顯示與提示是否符合預期。
- 手動測試確保返回此步驟時資料能回填且重新計算提示。

Git commit message: refine step3 diabetes flow
