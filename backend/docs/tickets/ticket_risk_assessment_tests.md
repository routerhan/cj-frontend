## Summary
撰寫風險評估相關單元與整合測試，涵蓋極高、非常高、高風險案例，驗證回應內容正確。

## Why
自動化測試能確保後端與前端邏輯長期一致，避免未來 refactor 造成風險判定錯誤。

## Scope
- 為風險評估服務層撰寫單元測試，覆蓋各風險層級與特殊案例。
- 為 API 路由撰寫整合測試，檢查 Pydantic 驗證與回應格式。
-（選用）為資料庫儲存流程撰寫測試，確認成功寫入。

## Out of Scope
- 新增業務邏輯或資料庫結構變更。
- 部署腳本或 CI/CD 整合。

## Acceptance Criteria
- 針對極高、非常高、高三種風險輸入提供測試案例，驗證 `level`, `matchedRules`, `recommendations`。
- 測試涵蓋 `metabolicSyndrome` 與 `riskFactors` 資料結構是否符合預期。
- API 整合測試驗證不合法輸入會得到 422，合法輸入回傳 200 與正確 payload。
- 測試可在指令（例如 `pytest`）下全部通過。

## Implementation Steps
1. 依據前端樣本資料撰寫測試 fixture，模擬不同風險情境的 payload。
2. 為風險服務層建立單元測試，斷言回傳物件內容。
3. 使用 FastAPI 測試客戶端撰寫 API 測試，包含驗證錯誤與成功案例。
4. 若資料庫儲存流程穩定，新增 transactional 測試確認持久化成功。
5. 將測試指令加入專案 README 或開發文件，方便執行。

## Test/Validation
- 在開發環境執行 `pytest`，確保所有測試案例皆為綠燈。
-（若適用）在 CI 或 pre-commit 中驗證測試套件可自動執行。
