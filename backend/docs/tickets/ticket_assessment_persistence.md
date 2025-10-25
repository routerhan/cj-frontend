## Summary
設計資料庫 Schema 與持久層，將每次風險評估的請求與結果保存至 PostgreSQL。

## Why
儲存評估結果能支援後續報表、稽核與使用者追蹤需求，也是醫療決策的重要依據。

## Scope
- 使用 SQLAlchemy 定義 `users`, `assessments`, `assessment_factors` 等資料表模型。
- 透過 Alembic 產生初始遷移檔並更新資料庫結構。
- 在儲存流程中保存原始 payload、計算結果與關聯的使用者資訊。

## Out of Scope
- 風險評估業務邏輯（依賴 Ticket: 業務邏輯服務）。
- 驗證與測試實作（另有測試 Ticket）。
- 使用者認證或授權流程細節。

## Acceptance Criteria
- Alembic 遷移可成功建立所需三張表格及必要索引／外鍵。
- SQLAlchemy 模型與遷移定義一致，並符合欄位命名與型別需求。
- API 呼叫流程可透過持久層成功寫入一筆評估紀錄及相關風險因子。
- 持久層錯誤會回傳適當例外或紀錄，避免資料遺失。

## Implementation Steps
1. 根據需求設計資料表欄位（例如使用者識別、評估時間、JSON payload、風險等級）。
2. 在 `app/models/` 新增 SQLAlchemy 模型檔案，定義三張表格與關聯。
3. 建立 Alembic 遷移，描述表格與索引結構，並執行 `alembic upgrade head` 驗證。
4. 撰寫儲存服務（例如 `app/repositories/assessments.py`），負責新增評估主檔與風險因子明細。
5. 更新 API 或服務層流程，在評估完成後呼叫儲存服務並回傳結果。

## Test/Validation
- 使用資料庫測試或 transactional fixture 確認遷移可執行、模型可建立／查詢。
- 以測試或互動命令（例如 FastAPI 測試客戶端）呼叫 API，檢查資料庫是否出現對應紀錄與關聯資料。
