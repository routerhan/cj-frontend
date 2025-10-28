# 管理者登入與儀表板授權設定

此文件說明如何設定管理者帳號、必要環境變數以及在本地測試登入流程。

## 必要環境變數

啟動 FastAPI 服務前，請於環境中設定以下變數（可放入 `.env` 或啟動腳本）：

| 變數名稱 | 範例值 | 說明 |
| --- | --- | --- |
| `ADMIN_JWT_SECRET` | `change-me-please` | 用於簽發 JWT 的對稱金鑰，請務必使用高熵字串並妥善保密。 |
| `ADMIN_TOKEN_TTL_MINUTES` | `60` | 管理者登入 token 的有效時間（分鐘），預設為 `60`。 |

若未設定 `ADMIN_JWT_SECRET`，後端將在啟動時拋出錯誤以避免使用不安全的設定。

## 建立／更新管理者帳號

專案提供 `backend/scripts/create_admin.py` 來快速建立管理者帳號：

```bash
cd backend
python -m scripts.create_admin admin@example.com --password 'StrongPass123!'
```

- 指定 `--reactivate` 可在帳號存在但停用時重新啟用並重設密碼。
- 若未提供 `--password` 參數，腳本會互動式要求輸入密碼。
- 密碼將以 PBKDF2-HMAC-SHA256 演算法雜湊並儲存。

## API 概觀

| 方法 | 路徑 | 說明 |
| --- | --- | --- |
| `POST` | `/api/admin/login` | 以 email/password 登入，成功回傳 Bearer token 與管理者資訊。 |
| `GET` | `/api/admin/me` | 驗證 Bearer token 並回傳目前登入管理者。 |
| `GET` | `/api/admin/assessments` | 需要 Bearer token，回傳儀表板資料清單與統計。 |

所有 `/api/admin/*` 路由都必須附帶 `Authorization: Bearer <token>` 標頭，否則會得到 `401 Unauthorized`。

## 儀表板預覽頁面

`GET /api/admin/dashboard` 提供單檔前端頁面，可用於本地快速預覽資料。首次開啟會顯示登入表單，成功登入後即會使用取得的 JWT 存取後端 API 並渲染問卷資料。

## 測試流程建議

1. 於本地資料庫建立管理者帳號：
   ```bash
   cd backend
   python -m scripts.create_admin admin@example.com --password 'StrongPass123!'
   ```
2. 啟動後端服務並確保已設定 `ADMIN_JWT_SECRET`。
```
export ADMIN_JWT_SECRET=a4c0488f4a053a80e51fc06922a9d341139fcd360253070a97ae1bb7fe8d0f6d
```
3. 使用 `httpie` 或 `curl` 測試登入：
   ```bash
   http POST :8000/api/admin/login email=admin@example.com password=StrongPass123!
   ```
4. 將回傳的 `accessToken` 帶入後續請求：
   ```bash
   http GET :8000/api/admin/assessments "Authorization:Bearer <token>"
   ```
5. 造訪 `http://127.0.0.1:8000/api/admin/dashboard`，輸入相同帳號密碼即可在瀏覽器驗證流程。

## 安全建議

- 建議透過 Secret Manager（或等價服務）管理 `ADMIN_JWT_SECRET`，避免明碼寫入設定檔。
- 定期輪替管理者密碼並重新簽發 JWT 金鑰。
- 若偵測到帳號遭濫用，可透過資料庫將 `admin_accounts.is_active` 設為 `False`，使用者將立即失去存取權。
