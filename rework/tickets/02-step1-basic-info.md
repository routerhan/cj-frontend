## Summary
更新第一步「基本資料」畫面，依新流程收集性別、出生年月日、身高體重、腰圍、抽菸及家族史，僅呈現必要的輸入欄位與說明。

## Why
客戶希望以低壓力問題開場，專注於收集「獨立事實」，避免太多即時資訊干擾填答，但仍需蒐集後端評估所需欄位。

## Scope
- 重新調整 Step1 的表單欄位順序與文案，採用 rework.md 所列問題。
- 內部可計算年齡、BMI、腰圍狀態等資訊供後端使用，但表單不需顯示即時提示。
- 確保所有欄位寫入 context 的新欄位名稱，與 StepStatus 行為維持完善。

## Out-of-Scope
- 不改變報告頁或其他步驟內容。
- 不新增後端 API 邏輯（另有票負責）。

## Acceptance Criteria
- Step1 畫面呈現 rework.md 指定的六個問題與必要說明，無額外即時結果顯示。
- 所有輸入提交後 `formData.basic` 相關欄位正確更新，重新載入 Step1 時可看到既有資料。
- 內部衍生資料（年齡、BMI、腰圍判定）可透過 context 取得但不直接顯示。

## Implementation Steps
1. 調整 Step1 component 之欄位結構、標籤與說明文字，使其符合 rework.md。
2. 使用 context helper（或在 component 內計算）即時計算年齡、BMI 與腰圍狀態，並以輕量提示顯示於 UI。
3. 更新欄位綁定的 key 與 `updateFormSection` 呼叫，確保資料寫入新的 `formData` 結構。
4. 更新相關測試或新增 component test，驗證計算與欄位呈現正確。

## Test/Validation
- 撰寫 React Testing Library 測試，驗證欄位輸入可成功更新 context 並在返回時回填。
- 手動在瀏覽器操作，確認欄位狀態維持並可順利進入下一步。

Git commit message: revamp step1 basics
