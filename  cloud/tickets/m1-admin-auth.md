## Summary
在 `backend` 內實作管理者帳號模型、密碼雜湊與 JWT 驗證流程，並為 `/api/admin/*` 路由加上保護，確保儀表板僅授權人員可存取。

## Why
後端目前沒有登入機制，儀表板路由直接公開。部署前必須具備安全的管理者鑑權與基本稽核，才能避免資料外洩。

## Scope
- 於 `backend/app/models/` 建立管理者資料表與 Alembic 遷移，採用雜湊密碼。
- 在 `backend/app/services/` 實作登入、token 產生與驗證服務，整合 FastAPI 依賴。
- 新增 `backend/app/api/admin_auth.py` 登入路由，並在 `backend/app/api/risk_assessment.py` 的儀表板資料 API 套用權限依賴。
- 將儀表板 HTML 抽離到 `backend/app/templates/admin_dashboard.html`，並在保護後再渲染。
- 擴充 `backend/requirements.txt` / `requirements-dev.txt` 以納入 `passlib[bcrypt]`、`python-jose[cryptography]` 等必要套件。
- 撰寫文件與測試，確保登入流程、權限限制、稽核記錄皆可運作。

## Out of Scope
- 視覺樣式或 UI 大改（保持現有 HTML 結構）。
- 引入社群登入、2FA 等進階鑑別機制。
- 抽離成多角色或 RBAC 權限系統。

## Acceptance Criteria
- `AdminAccount`（或等同命名）的資料表完成遷移並支援雜湊密碼欄位。
- `POST /api/admin/login` 接收帳號密碼，成功時回傳 JWT，失敗時回傳 401 並記錄嘗試。
- 儀表板頁面與 `/api/admin/assessments` 在未附帶有效 JWT 時一律回傳 401。
- 有測試覆蓋成功登入、錯誤密碼、token 過期以及未授權訪問儀表板。
- `README` 或 `backend/docs` 有初始化管理員、設定環境變數（`ADMIN_JWT_SECRET` 等）的操作指引。

## Implementation Steps
1. **資料模型與遷移**
   - 新增 `backend/app/models/admin_account.py`，欄位涵蓋 `account_name`、`hashed_password`、`is_active`、`last_login_at`。
   - 更新 `backend/app/models/__init__.py` 載入新模型。
   - 在 `backend/alembic/versions/` 建立新遷移（`alembic revision --autogenerate -m "add admin account"`），確認 `alembic.ini` 內 `target_metadata` 引用新模型，再執行 `alembic upgrade head`。
2. **安全與服務層**
   - 建立 `backend/app/services/security.py`，封裝 `get_password_hash`、`verify_password`（使用 `passlib.context.CryptContext`）與 `create_access_token`（基於 `jose.jwt`）。
   - 新增 `backend/app/services/auth.py`，提供 `AdminAuthService` 與 FastAPI 依賴 `get_admin_auth_service`，處理登入與 `last_login_at` 更新。
   - 更新 `backend/app/services/__init__.py` 匯出新服務。
3. **API 與依賴**
   - 新增 `backend/app/api/dependencies.py`，包含 `get_current_admin`，從 `Authorization: Bearer` 解析 JWT 並抓取管理者資料。
   - 建立 `backend/app/api/admin_auth.py`，提供 `POST /api/admin/login` 以及（選擇性）`GET /api/admin/me`。
   - 更新 `backend/app/api/__init__.py` 將 `admin_auth_router` 與既有 `risk_assessment_router` 合併。
   - 修改 `backend/app/api/risk_assessment.py`：
     - 將儀表板 GET 改為引用 `Jinja2Templates` 渲染 `backend/app/templates/admin_dashboard.html`。
     - 為 `/api/admin/assessments` 新增 `Depends(get_current_admin)`，並將審計資訊寫入 `backend/app/services/auth.py` 的記錄方法。
4. **設定與環境**
   - 在 `backend/requirements.txt` 與 `requirements-dev.txt` 加入 `passlib[bcrypt]`, `python-jose[cryptography]`, `python-multipart`（用於 `OAuth2PasswordRequestForm`）。
   - 更新 `backend/app/main.py` 或 `backend/app/api/__init__.py`，確保新的 router 被載入且 CORS 設定允許前端傳送 Authorization header（若尚未設定）。
   -於 `backend/docs/admin-auth.md`（若無新建）寫下環境變數 `ADMIN_JWT_SECRET`, `ADMIN_TOKEN_TTL_MINUTES`, 初始帳號建立方式（例如 `alembic` seeding 或 `backend/scripts/create_admin.py`）。
5. **測試與範例**
   - 在 `backend/tests/` 新增 `test_admin_auth.py`，測試密碼驗證、token 產生與受保護路由。
   - 更新 `backend/tests/conftest.py`，提供 `admin_user_factory` 與 `auth_headers` fixture。
   - 補齊 `backend/tests/test_risk_api.py` 中儀表板相關測試，加入未授權與已授權情境。
6. **稽核與日誌**
   - 在 `AdminAuthService` 中加入基本 `logging`，記錄登入成功/失敗與異常。
   - 確認 FastAPI 全域例外處理（可在 `backend/app/main.py`）對未授權情況統一回應。

## Test/Validation
- 執行 `pytest backend/tests/test_admin_auth.py backend/tests/test_risk_api.py::test_dashboard_requires_auth`，確認所有情境通過。
- 使用 `curl` 或 `httpie` 手動驗證 `POST /api/admin/login` 與帶 JWT 存取 `/api/admin/assessments`。
- 啟動本地伺服器（`uvicorn app.main:app --reload`）並於瀏覽器測試儀表板需要登入。

Git commit message: secure admin auth
