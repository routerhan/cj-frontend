## Summary
調整第二步「血壓與血脂」頁面，收集用藥狀況與三高檢驗值，並提供即時警示提示。

## Why
新流程要求集中取得高血壓與血脂的核心指標，讓使用者參考健檢數據填寫，同時在前端即時提醒異常門檻。

## Scope
- 修改 Step2 內容為：高血壓用藥、血壓值、LDL-C、HDL-C、三酸甘油酯、TG 用藥。
- 針對血壓、LDL-C、HDL-C 顯示即時判定提示（偏高/偏低），TG 藥物或數值提供代謝症候群提示。
- 確保欄位寫入新的 context keys，與 Step1 調整後的資料結構相容。

## Out-of-Scope
- 不處理任何後端邏輯或代謝症候群計算（另有票處理）。
- 不變更其他步驟或頁面設計。

## Acceptance Criteria
- Step2 畫面符合 rework.md 的問題順序與文案。
- 使用者輸入血壓≥130/85 時出現提示；LDL≥190、HDL（男<40，女<50）顯示對應警語。
- TG 數值≥150 或勾選 TG 用藥時即時顯示代謝症候群提示。
- 所有欄位資料正確寫入 context 並可在回到此步驟時回填。

## Implementation Steps
1. 更新 Step2 component 的表單結構、說明文字與欄位綁定。
2. 引入性別與其他 helper 計算，即時顯示血壓、LDL、HDL、TG 的狀態訊息。
3. 確認欄位 key 與 `updateFormSection` 呼叫對應新資料結構，並保留輸入驗證。
4. 補強元件測試檢查提示條件，確保不同輸入下顯示正確。

## Test/Validation
- 使用 React Testing Library 撰寫互動測試，驗證異常提示在各臨界值出現。
- 手動測試多次進入此步驟，資料保持並可順利往下一步。

Git commit message: update step2 bp lipids
