## Summary
更新第一步「基本資料」畫面，依新流程收集性別、出生年月日、身高體重、腰圍、抽菸及家族史，並提供即時計算提示。

## Why
客戶希望以低壓力問題開場，同時讓使用者立即看到年齡、BMI、腰圍判定等回饋，提升完成率並提供後端所需事實資料。

## Scope
- 重新調整 Step1 的表單欄位順序與文案，採用 rework.md 所列問題。
- 於前端計算並即時顯示年齡（由出生年月日推算）、BMI（由身高體重）、以及腰圍是否達到性別門檻。
- 確保所有欄位寫入 context 的新欄位名稱，與 StepStatus 行為維持完善。

## Out-of-Scope
- 不改變報告頁或其他步驟內容。
- 不新增後端 API 邏輯（另有票負責）。

## Acceptance Criteria
- Step1 畫面呈現 rework.md 指定的六個問題與互動提示。
- 輸入生日會顯示「目前年齡：XX 歲」，身高/體重輸入後顯示 BMI，腰圍依性別立即顯示是否符合腹部肥胖標準。
- 所有輸入提交後 `formData.basic` 相關欄位正確更新，重新載入 Step1 時可看到既有資料。

## Implementation Steps
1. 調整 Step1 component 之欄位結構、標籤與說明文字，使其符合 rework.md。
2. 使用 context helper（或在 component 內計算）即時計算年齡、BMI 與腰圍狀態，並以輕量提示顯示於 UI。
3. 更新欄位綁定的 key 與 `updateFormSection` 呼叫，確保資料寫入新的 `formData` 結構。
4. 更新相關測試或新增 component test，驗證計算與欄位呈現正確。

## Test/Validation
- 撰寫 React Testing Library 測試，驗證輸入不同生日/身高體重/腰圍後對應提示是否顯示正確。
- 手動在瀏覽器操作，確認欄位狀態維持並可順利進入下一步。

Git commit message: revamp step1 basics
