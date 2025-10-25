## Summary
實作後端風險評估服務層，重現前端 `evaluateRiskAssessment` 的優先邏輯並組裝回應資料。

## Why
確保風險等級判斷在後端與前端一致，才能提供正確的 `level`、`matchedRules`、`riskFactors` 與建議內容。

## Scope
- 參考 `src/utils/riskRules.js` 的規則與優先序，設計可維護的 Python 對應邏輯。
- 計算 `matchedRules`, `riskFactors`, `metabolicSyndrome`, `recommendations` 等欄位。
- 提供服務層介面供 API 路由呼叫，回傳 `RiskAssessmentResponse` 模型。

## Out of Scope
- API 路由與資料庫儲存細節（依賴 Ticket: API 契約）。
- Alembic 遷移與 SQLAlchemy model 實作。
- 自動化測試（依賴專屬測試 ticket）。

## Acceptance Criteria
- 業務邏輯可依序判斷「極高→非常高→高→中／低／未定義」，命中條件後立即返回。
- `matchedRules` 包含觸發的規則識別碼或說明，並保持與前端一致。
- `riskFactors` 與 `metabolicSyndrome` 結構與前端預期對齊。
- 服務層以純函式或類別實作，便於測試與重用。

## Implementation Steps
1. 將 `riskRules.js` 解析成 Python 對應資料結構，定義規則常數或設定檔。
2. 建立服務模組（例如 `app/services/risk_assessment.py`），實作核心函式 `evaluate_risk_assessment(payload) -> RiskAssessmentResponse`.
3. 處理規則匹配時的資料蒐集：記錄命中的條件、累計風險因子、計算代謝症候群指標。
4. 與 Ticket: API 契約中定義的模型整合，確保回傳型別正確。
5. 為複雜邏輯區塊添加註解或拆分子函式，提升可讀性。

## Test/Validation
- 使用純函式單元測試（可參考 Ticket: 測試驗證），針對各風險層級建立案例，確認輸出欄位內容。
