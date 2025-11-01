## Summary
重構第四步「腎臟病」頁面，詢問 CKD 診斷並提供選填檢驗指標，僅呈現必要說明與欄位。

## Why
CKD 是高風險判定的重要因素，需要依客戶要求提供診斷題與選填數據，同時降低前端噪音，將判定留給後端。

## Scope
- 重新設計 Step4 表單，包含：是否被診斷 CKD、選填 eGFR 與 UACR 欄位。
- 前端不需顯示 eGFR/UACR 的即時異常提示，僅提供輸入欄位與必要引導。
- 將資料寫入 context 的 kidney 區段，後端可利用衍生指標計算。

## Out-of-Scope
- 風險分級與代碼判斷（後端票處理）。
- 其他步驟或報告頁面。

## Acceptance Criteria
- Step4 畫面符合 rework.md 指定的題目與文案，檢驗資料為選填。
- 表單不顯示即時異常提示，但可將輸入資料與計算結果寫入 context。
- 返回此步驟時資料保持一致，可更新並重新計算（僅供後端使用）。

## Implementation Steps
1. 更新 Step4 component 內容與欄位綁定至新的 context key。
2. 確保 CKD 診斷與檢驗資料寫入 context，並維持漸進式顯示（診斷為否時仍可填寫檢驗值）。
3. 保留 eGFR 計算邏輯供後端使用，但前端僅顯示輸入欄位。
4. 撰寫或更新 component 測試，覆蓋資料回填與欄位驗證。

## Test/Validation
- React Testing Library 測試，驗證不同輸入下資料寫入及回填行為正確。
- 手動檢查頁面刷新與返回時資料保持。

Git commit message: update step4 kidney inputs
