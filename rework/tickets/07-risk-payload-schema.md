## Summary
同步更新前端傳輸 payload 與後端 schema，反映新問卷欄位並維持報告輸出格式。

## Why
前後端需要共用一致的資料契約，才能以新的事實欄位驅動風險邏輯，同時保持既有報告呈現。

## Scope
- 調整 `src/utils/riskMapper.js`（或等效模組）組合新的輸入欄位，確保只送出 rework.md 所列事實。
- 更新後端 FastAPI request schema（Pydantic）與資料驗證，支援新欄位與型別，移除舊欄位。
- 維持 response schema 和前端報告取用欄位不變，必要時以 mapper 將新判斷結果映射為既有格式。
- 更新相關單元測試與 fixture。

## Out-of-Scope
- 風險判斷邏輯（由下一張票負責）。
- UI 呈現與前端步驟互動。

## Acceptance Criteria
- 前端送出的 payload 僅包含新流程的事實欄位，後端能成功解析並驗證。
- 既有報告頁可在新 response schema 下正常顯示，不需要額外改動。
- 自動化測試更新成功，`pytest` 與前端 mapper 測試均通過。

## Implementation Steps
1. 調整前端 risk mapper，將表單資料整理成新的 API payload（含性別、年齡、三高、病史等欄位）。
2. 更新 FastAPI 的 Pydantic request model，加入必要欄位與校驗，移除舊欄位。
3. 視需要新增後端 payload-to-domain 轉換 helper，以便後續風險服務使用。
4. 更新前後端測試（fixtures、snapshots），確保新 payload 可被序列化與解析。

## Test/Validation
- 執行 `npm run test`（或相對應單元測試）驗證 mapper 行為。
- 執行 `pytest` 確認 API schema 測試通過，新的 payload 可被接受。

Git commit message: align risk payload schema
