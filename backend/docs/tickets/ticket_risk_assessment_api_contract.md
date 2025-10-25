## Summary
建立 `POST /api/risk-assessment` 的 FastAPI 路由與 Pydantic 請求／回應模型，確保後端契約完全對齊前端需求。

## Why
清楚的 API 契約能避免前後端在欄位命名與型別上的歧義，是後續業務邏輯與資料儲存的基礎。

## Scope
- 分析 `src/utils/riskMapper.js` 與 `src/context/FormContext.jsx`，定義請求模型欄位與驗證規則。
- 參考 `src/utils/riskRules.js` 與 `src/steps/Step4_Report.jsx`，定義回應模型欄位。
- 在 FastAPI 中建立 `POST /api/risk-assessment` 路由骨架與依賴注入介面（未含業務邏輯）。

## Out of Scope
- 風險等級判斷邏輯實作。
- 與資料庫互動、儲存或查詢流程。
- 單元或整合測試撰寫。

## Acceptance Criteria
- 定義的 Pydantic 請求模型能涵蓋前端所有傳送欄位並提供必要的型別／範圍驗證。
- 回應模型包含 `level`, `matchedRules`, `riskFactors`, `recommendations`, `metabolicSyndrome` 等前端預期欄位。
- FastAPI 路由能成功透過契約檢驗傳入 JSON，並以模型格式回傳（可使用假資料暫時回傳）。

## Implementation Steps
1. 逐項比對 `riskMapper` 與 `FormContext` 中的欄位，整理成 Pydantic 模型欄位清單與型別。
2. 根據整理結果建立 `RiskAssessmentRequest` 模型，加入必要的驗證（例如列舉值、最小值等）。
3. 依 `riskRules` 與 `Step4_Report` 建立 `RiskAssessmentResponse` 模型與相關子模型。
4. 在 FastAPI 新增路由模組（例如 `app/api/risk_assessment.py`），掛載 `POST /api/risk-assessment`，並注入服務層 placeholder。
5. 驗證路由能接受與返回模型，確保與前端欄位對齊，保留 TODO 註記於未實作的業務邏輯位置。

## Test/Validation
- 使用 FastAPI 測試客戶端或 `pytest` 建立基本路由測試，驗證請求使用不合法欄位時會回傳 422。
- 送出符合契約的樣本 payload，確保可成功通過驗證並回傳符合模型的假資料。
