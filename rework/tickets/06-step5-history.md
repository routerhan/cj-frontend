## Summary
調整第五步「心血管病史」表單，涵蓋 CAC、斑塊、ASCVD、細部病史與冠狀動脈進階問題的漸進式揭露。

## Why
客戶要求以細緻病史資料支援高、非常高、極高風險分級，需依 rework.md 完整蒐集各項 ASCVD 相關事實。

## Scope
- Step5 需包含：CAC 問題、顯著斑塊、ASCVD 診斷、CAD/PAD/頸動脈狹窄多選，以及針對 CAD 啟動的進階問題（近一年心肌梗塞、總 MI 次數≥2、多支血管阻塞）。
- 提供 CAC ≥ 400 的即時提示。
- 確保多選與進階問題資料寫入 context 並可回填。

## Out-of-Scope
- 後端風險分級邏輯與報告呈現（另有票）。
- 其他步驟與表單外觀調整。

## Acceptance Criteria
- Step5 內容、順序與漸進式邏輯完全符合 rework.md 定義。
- 勾選 CAD 時才顯示進階冠狀動脈問題；其他情境不出現。
- CAC ≥ 400 時立即顯示提示訊息。
- 來回切換步驟資料保持不丟失。

## Implementation Steps
1. 重構 Step5 component，加入多選與條件式渲染區塊，控制顯示邏輯。
2. 新增 CAC 提示與相關輸入驗證；確保多選資料以陣列或布林 map 形式寫入 context。
3. 為 CAD 被勾選時的進階問題實作顯示控制與資料綁定。
4. 撰寫 component 測試涵蓋各種顯示條件與資料回填。

## Test/Validation
- React Testing Library 測試多種組合，確保提示與進階區塊顯示正確。
- 手動驗證返回此步驟時輸入資料維持。

Git commit message: expand step5 history flow
