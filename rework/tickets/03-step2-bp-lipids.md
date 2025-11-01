## Summary
調整第二步「血壓與血脂」頁面，收集用藥狀況與三高檢驗值，僅呈現必要的輸入欄位與說明。

## Why
新流程要求集中取得高血壓與血脂的核心指標，讓使用者參考健檢數據填寫，同時減少前端即時提示造成的干擾。

## Scope
- 修改 Step2 內容為：高血壓用藥、血壓值、LDL-C、HDL-C、三酸甘油酯、TG 用藥。
- 前端僅顯示欄位與必要說明，不呈現即時風險/提示；衍生資訊保留於 context 供後端計算。
- 確保欄位寫入新的 context keys，與 Step1 調整後的資料結構相容。

## Out-of-Scope
- 不處理任何後端邏輯或代謝症候群計算（另有票處理）。
- 不變更其他步驟或頁面設計。

## Acceptance Criteria
- Step2 畫面符合 rework.md 的問題順序與文案，無即時異常提示。
- 所有欄位資料正確寫入 context 並可在回到此步驟時回填。
- 衍生資訊（血壓/LDL/HDL/TG 判定）可透過 context 使用於後端或報告。

## Implementation Steps
1. 更新 Step2 component 的表單結構、說明文字與欄位綁定。
2. 引入性別與其他 helper 計算，即時顯示血壓、LDL、HDL、TG 的狀態訊息。
3. 確認欄位 key 與 `updateFormSection` 呼叫對應新資料結構，並保留輸入驗證。
4. 補強元件測試檢查提示條件，確保不同輸入下顯示正確。

## Test/Validation
- 使用 React Testing Library 撰寫互動測試，驗證欄位可正確寫入 context 並重回步驟時回填。
- 手動測試多次進入此步驟，資料保持並可順利往下一步。

Git commit message: update step2 bp lipids
