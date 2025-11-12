# Commjat Cardiovascular Risk Assessment

此專案包含前端 (React + Vite) 與後端 (FastAPI + SQLAlchemy + Alembic)，用於心血管風險評估。以下整理常用指令、環境變數、資料庫驗證流程與關鍵程式碼，方便快速查詢。

---

## Demo (資料庫和使用者已建置)
```bash
# 建置前端 並且 啟動後端聆聽 （/根目錄）
source ./backend/.env && npm run build && uvicorn backend.app.main:app --port 8000 --reload

```

## 快速啟動指令 (首次)

```bash
# 初始化資料庫 於後端 (backend/)
cd backend
pip install -r requirements.txt

# 建立資料表 (root/)
cd ..
source backend/.env && alembic -c backend/alembic.ini upgrade head

# 建立儀表板使用者 (backend/)
cd backend
python -m scripts.create_admin admin@example.com --password 'pass4admin'

# 建置前端 並且 啟動後端聆聽 （回到根目錄）
cd ..
source ./backend/.env && npm run build && uvicorn backend.app.main:app --port 8000 --reload

```
---

# 5. 打開醫師儀表板檢視資料（新分頁輸入）
# http://127.0.0.1:8000/api/admin/dashboard

# 6. 選擇性：執行測試

---

## 主要環境變數

| 變數 | 預設值 | 說明 | 部署時注意 |
|------|--------|------|-------------|
| `DATABASE_URL` | `sqlite:///./backend/app.db` | SQLAlchemy 連線字串 | 改成正式資料庫，如 `postgresql+psycopg://user:password@host/db` |
| `ADMIN_JWT_SECRET` | 無預設（必填） | 管理者登入使用的 JWT 金鑰 | 各環境請使用不同的高熵字串並妥善保護 |
| `ADMIN_TOKEN_TTL_MINUTES` | `60` | 管理者登入 token 有效時間（分鐘） | 可依安全需求調整；更換後舊 token 會失效 |

---

## 單一容器建置與部署

整合後的服務使用 repo 根目錄的 `Dockerfile`。容器在啟動時會同時供應 React 靜態檔與 FastAPI API。

### 本地測試驗證（Podman）

```bash
# 1. 建置映像（同部署使用的 Dockerfile）
podman build -t cj-app:local .

# 2. 建立 pod，對外暴露 8080
podman pod create --name cj-stack -p 8080:8080

# 3. 啟動 PostgreSQL（模擬 Cloud SQL）
podman run --rm --pod cj-stack --name cj-db \
  -e POSTGRES_DB=cjdb \
  -e POSTGRES_USER=cjapp \
  -e POSTGRES_PASSWORD='ChangeMe123!' \
  docker.io/library/postgres:16-alpine

# 4. 啟動應用容器，連線到 cj-db
podman run --rm --pod cj-stack --name cj-app \
  -e PORT=8080 \
  -e DATABASE_URL='postgresql+psycopg://cjapp:ChangeMe123!@cj-db:5432/cjdb' \
  -e ADMIN_JWT_SECRET='local-secret' \
  cj-app:local
```

> 若僅需 SQLite，可將 `DATABASE_URL` 改為 `sqlite:////data/app.db`，並加入 `-v "$(pwd)/.data":/data` 以保留資料。

在應用容器啟動後，執行下列命令完成資料庫設定與管理者建立：

```bash
# 套用 Alembic 遷移
podman exec cj-app alembic upgrade head

# 建立或重設管理者帳號
podman exec -it cj-app python -m scripts.create_admin admin@example.com --password 'StrongPass123!'
```

測試完成後，可停用並移除 pod：

```bash
podman pod stop cj-stack
podman pod rm cj-stack
```

### 使用 Cloud Build

`cloud/cloudbuild.yaml` 已設定單一路徑服務建置

請參考 `cloud/command.md` 步驟說明。

---

## 醫師儀表板

- 後端提供的純 HTML 儀表板：`http://127.0.0.1:8000/api/admin/dashboard`，不需啟動前端即可快速檢視。
- 透過 `/api/admin/assessments` 取得評估紀錄與統計，可用 `limit` 參數調整載入筆數。
- 呈現總評估次數、平均危險因子數、層級分佈（皆為全資料庫統計）、命中規則與原始 payload JSON，方便醫師理解資料。
- 若部署在雲端，請確保外部能存取此路徑（建議加上身分驗證／IP 白名單）。

---

## 前端工作流程

1. `npm run dev` 啟動開發伺服器。Vite config (`vite.config.js`) 已設定：
   ```js
   server: {
     proxy: {
       '/api': {
         target: 'http://127.0.0.1:8000',
         changeOrigin: true,
         secure: false,
       },
     },
   },
   ```
2. 送出表單後會呼叫 `src/utils/riskApi.js` 的 `requestRiskAssessment`，自動使用 proxy 指到後端。
3. 若需指向不同 API（例如測試環境），仍可於 `.env` 設定 `VITE_API_BASE_URL`；單一容器部署時不需設定此值。

### 前端測試

```bash
# 單次
npm run test -- Step4_LipidProfile

# 全部測試
npm run test
```

---

## 後端工作流程

1. 進入 `backend/`，確認虛擬環境已啟用並設定好 `DATABASE_URL`。
2. 建立或更新資料表：
   ```bash
   alembic upgrade head
   ```
3. 啟動 API：
   ```bash
   uvicorn app.main:app --reload
   ```
4. 測試套件 (含服務層與 API 整合)：
   ```bash
   pip install -r requirements-dev.txt  # 第一次需要安裝測試套件
   pytest
   ```

Alembic 版本腳本位於 `backend/alembic/versions/`，新增 schema 變更時請建立新遷移檔。

---

## 資料庫驗證

預設使用 SQLite，資料檔案位置為 `backend/app.db`。以下為常用查詢：

```bash
cd backend
sqlite3 app.db ".tables"
# alembic_version  assessment_factors  assessments  users

sqlite3 app.db "SELECT id, level_code, risk_factor_count, created_at FROM assessments ORDER BY id DESC LIMIT 3;"
# 範例輸出
# 7|high|3|2025-10-26 15:10:42.123456

sqlite3 app.db "SELECT code, present FROM assessment_factors WHERE assessment_id = 7;"
# hypertension|1
# metabolic_syndrome|1
# ...
```

若改用 PostgreSQL / MySQL，請更新 `DATABASE_URL` 並使用對應工具（例如 `psql`、DBeaver）查詢相同的 `assessments` 與 `assessment_factors` 表。

---

## 關鍵程式碼索引

- 前端
  - `src/steps/Step4_Report.jsx`：呼叫 API、顯示結果；內含 `hasRequestedRef` 避免重複請求。
  - `src/steps/Step4_LipidProfile.jsx`：血脂欄位即時驗證與錯誤訊息。
  - `src/utils/riskApi.js`：封裝 `fetch` 呼叫。
  - `src/utils/riskMapper.js`：將表單資料映射成後端 payload。
  - `src/utils/riskRules.js`：原前端風險判定邏輯，後端作為參考。

- 後端
  - `backend/app/schemas/risk_assessment.py`：Pydantic request/response 模型。
  - `backend/app/services/risk_assessment.py`：核心風險判定與資料庫持久化。
  - `backend/app/repositories/assessments.py`：儲存 `assessments` 與 `assessment_factors`。
  - `backend/app/models/*.py`：SQLAlchemy ORM 定義。
  - `backend/app/api/risk_assessment.py`：`POST /api/risk-assessment` 路由。
  - `backend/tests/`：Pytest 單元／整合測試。

---

## 部署注意事項

- 透過 `cloud/cloudbuild.yaml` 建置單一映像後部署 Cloud Run，並設定 `DATABASE_URL`、`ADMIN_JWT_SECRET` 等必要環境變數。
- Cloud Run 若需連線 Cloud SQL，請記得啟用 `--add-cloudsql-instances` 並提供對應的 Service Account 權限。
- 部署前務必執行 `alembic upgrade head`（或在啟動腳本中保留 migrations 流程）。
- `Step4_Report.jsx` 內的 `hasRequestedRef` 仍負責避免重複送出 API，後續調整請確保同樣的保護機制存在。

---

## 常見排錯

1. **資料庫沒有寫入**  
   - 確認 `DATABASE_URL` 指向正確位置，並已執行 `alembic upgrade head`。
   - 檢查後端 log 是否收到請求，是否有例外訊息。
   - 確認前端未再掛載 mock server（已完全移除）。

2. **輸入超出範圍**  
   - 前端 Step4 會即時提示，欄位訊息對應 `translations.js` 的 `ldlRange` / `hdlRange` / `tgRange`。
   - 後端 Pydantic 仍保留範圍限制作為安全網。

3. **重複寫入**  
   - 若觀察到相同時間戳記的多筆資料，檢查前端是否在新版 `Step4_Report` 基礎上修改；`hasRequestedRef` 必須保留。

---
