你現在是使用 FastAPI + Pydantic + SQLAlchemy（PostgreSQL）的後端工程師。前端已完成七步驟心血管風險評估表單，會呼叫 `POST /api/risk-assessment`。請根據下列資訊產生後端實作：

[1] API 契約
- Method: POST /api/risk-assessment
- Request JSON schema 與欄位說明取自以下前端檔案：
  * src/utils/riskMapper.js
  * src/context/FormContext.jsx
- Response JSON schema 需符合前端期望（參考 src/utils/riskRules.js 與 src/steps/Step4_Report.jsx）。

[2] 商業邏輯
- 必須實作與 `src/utils/riskRules.js` 中 `evaluateRiskAssessment` 等價的邏輯：依序檢查「極高 → 非常高 → 高 → 中／低／未定義」，並在命中優先條件後立即回傳。
- 需計算 `matchedRules`, `riskFactors`, `metabolicSyndrome` 等欄位，內容請對照前端檔案。

[3] 程式碼
- FastAPI 路由、Pydantic 模型、服務層、資料庫存取（SQLAlchemy + Alembic migration）。
- 資料庫 schema：至少含 `users`, `assessments`, `assessment_factors`；每次呼叫記錄原始 payload 與運算結果。
- 提供關鍵程式碼片段（模型、服務、儲存流程），並說明如何執行（uvicorn 指令或 Docker Compose）。

[4] 驗證與測試
- 使用 Pydantic 驗證 request。
- 產生單元測試或整合測試：涵蓋「極高」、「非常高」、「高」風險案例，驗證回傳 `level`, `matchedRules`, `recommendations` 是否正確。

[5] 部署與環境變數
- 列出需要的環境變數（例如 DB_URL）。
- 說明如何啟動專案（pip install、alembic upgrade、uvicorn）。

請以 Python/FastAPI 程式碼展示主要結構，並使用中文敘述。


後端工程師在撰寫 FastAPI 提示詞與實作時可以直接參考：

src/utils/riskMapper.js:1：前端如何把表單資料轉換成後端 API payload；欄位名稱、型別與單位都在這裡。
src/utils/riskApi.js:1：前端呼叫 /api/risk-assessment 的封裝，顯示目前預期的 HTTP method、URL、Content-Type。
src/utils/riskRules.js:1：完整的風險優先順序與條件邏輯（極高 → 非常高 → 高 → 風險因子計數），後端需完全對齊。
src/steps/Step4_Report.jsx:1：前端如何消費 API 回應；可看到期望的欄位（level, matchedRules, riskFactors, recommendations…）。
src/context/FormContext.jsx:41：表單資料結構，協助後端了解前端儲存哪些欄位，方便對照 request schema。


