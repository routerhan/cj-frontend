## Summary
重構第四步「腎臟病」頁面，詢問 CKD 診斷並提供選填檢驗指標與即時提醒。

## Why
CKD 是高風險判定的重要因素，需要依客戶要求提供診斷題與選填數據，同時顯示異常提示。

## Scope
- 重新設計 Step4 表單，包含：是否被診斷 CKD、選填 eGFR 與 UACR 欄位。
- 提供 eGFR < 60、UACR ≥ 30 的即時異常提示。
- 將資料寫入 context 的 kidney 區段。

## Out-of-Scope
- 風險分級與代碼判斷（後端票處理）。
- 其他步驟或報告頁面。

## Acceptance Criteria
- Step4 畫面符合 rework.md 指定的題目與文案，檢驗資料為選填。
- 當 eGFR < 60 或 UACR ≥ 30 時即時顯示警示訊息。
- 返回此步驟時資料保持一致，可更新並即時重新提示。

## Implementation Steps
1. 更新 Step4 component 內容與欄位綁定至新的 context key。
2. 實作 eGFR、UACR 的即時判定提示與輸入格式驗證。
3. 確保 CKD 診斷與檢驗資料寫入 context，並維持漸進式顯示（診斷為否時仍可填寫檢驗值）。
4. 撰寫或更新 component 測試，覆蓋異常提示場景與資料回填。

## Test/Validation
- React Testing Library 測試，驗證在不同輸入下提示狀態正確。
- 手動檢查頁面刷新與返回時資料保持。

Git commit message: update step4 kidney inputs
