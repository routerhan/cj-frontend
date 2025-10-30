# Commjat Cardiovascular Risk Assessment

此專案包含前端 (React + Vite) 與後端 (FastAPI + SQLAlchemy + Alembic)，用於心血管風險評估。以下整理常用指令、環境變數、資料庫驗證流程與關鍵程式碼，方便快速查詢。

---

## 快速啟動指令

```bash
# 安裝前端依賴（首次，在專案根目錄）
npm install

# 啟動前端 (http://127.0.0.1:5173)
npm run dev

# 安裝後端依賴（於 backend/ 目錄內）
pip install -r requirements.txt

# 建立資料表 (backend/)
export DATABASE_URL=sqlite:///./dev.db
alembic upgrade head

# 啟動後端 (http://127.0.0.1:8000)
uvicorn app.main:app --reload
```

> Windows PowerShell 可使用 `setx DATABASE_URL "sqlite:///./dev.db"` 後重新開啟終端。

前後端同時啟動後，前端會透過 Vite proxy 轉發 `/api` 請求到後端。

---

## Demo 範例流程（開發者操作）

```bash
# 1. 安裝依賴並啟用虛擬環境
cd /path/to/cj-frontend
npm install
cd backend
python -m venv .venv && source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt

# 2. 建立資料表並啟動後端
export DATABASE_URL=sqlite:///./dev.db
alembic upgrade head
uvicorn app.main:app --reload

# 3. 新開一個終端啟動前端
cd /path/to/cj-frontend
npm run dev

# 4. 走完整個表單流程後，可在 backend/ 終端驗證資料
sqlite3 backend/dev.db "SELECT id, level_code, risk_factor_count FROM assessments ORDER BY id DESC;"
sqlite3 backend/dev.db "SELECT code, present FROM assessment_factors WHERE assessment_id = <上一步的 id>;"

# 5. 打開醫師儀表板檢視資料（新分頁輸入）
# http://127.0.0.1:8000/api/admin/dashboard

# 6. 選擇性：執行測試
cd backend && pytest
npm run test -- Step4_LipidProfile
```

以上流程示範了從安裝依賴、啟動服務、操作表單到驗證資料庫與執行測試的全套開發 Demo。

---

## 依賴管理

- **前端**：使用 `package.json`／`package-lock.json` 管理，執行 `npm install` 會安裝所有依賴。
- **後端**：
  - `backend/requirements.txt`：執行環境必備套件（FastAPI、SQLAlchemy、Alembic、Pydantic、Uvicorn、psycopg）。
  - `backend/requirements-dev.txt`：延伸自 `requirements.txt`，額外加入 `pytest`、`httpx` 等測試套件；開發者可用 `pip install -r requirements-dev.txt` 一次安裝。

> 若日後新增外部套件，請同步更新對應的 requirements 檔案與 README。

---

## 主要環境變數

| 變數 | 預設值 | 說明 | 部署時注意 |
|------|--------|------|-------------|
| `DATABASE_URL` | `sqlite:///./dev.db` | SQLAlchemy 連線字串 | 改成正式資料庫，如 `postgresql+psycopg://user:password@host/db` |
| `VITE_API_BASE_URL` (選用) | 空字串 | 若未設定會由 Vite proxy 轉送；部署在同網域外時用於指定 API 來源 | 部署到不同網域時要設為 API 實際 URL |
| `ADMIN_JWT_SECRET` | 無預設（必填） | 管理者登入使用的 JWT 金鑰 | 各環境請使用不同的高熵字串並妥善保護 |
| `ADMIN_TOKEN_TTL_MINUTES` | `60` | 管理者登入 token 有效時間（分鐘） | 可依安全需求調整；更換後舊 token 會失效 |

---

## 使用 Podman 啟動整合環境

專案提供 `podman-compose.yml` 與範例環境檔協助在本地模擬 Cloud Run 佈署：

### 第一次使用

1. 複製環境檔並調整需要的設定（只需做一次）：
   ```bash
   cp .env.podman.example .podmanenv
   ```
2. 啟動所有服務（前端、後端、PostgreSQL）：
   ```bash
   podman compose -f podman-compose.yml --env-file .podmanenv up --build
   ```
3. 服務啟動後可造訪：
   - 前端問卷：<http://localhost:5173>
   - API/Swagger：<http://localhost:8000/docs>
   - 醫師儀表板：<http://localhost:8000/api/admin/dashboard>
4. 建立第一個管理者帳號（僅首次需要）：
   ```bash
   podman compose -f podman-compose.yml exec backend \
     python -m scripts.create_admin admin@example.com --password 'StrongPass123!'
   ```
   後續如需新增或重設帳號，可重複這個指令。

更多細節與排錯指南見 `docs/container-local.md`。

### 常用 Podman 指令

```bash
# 以 .podmanenv 啟動整個 stack（前端 / 後端 / PostgreSQL）
podman compose -f podman-compose.yml --env-file .podmanenv up --build -d

# 查看服務狀態
podman compose -f podman-compose.yml ps

# 進入後端容器建立管理者帳號
podman compose -f podman-compose.yml exec backend \
  python -m scripts.create_admin admin@example.com --password 'StrongPass123!'

# 在後端容器內執行測試
podman compose -f podman-compose.yml exec backend pytest

# 停止並移除服務（保留資料卷）
podman compose -f podman-compose.yml down

# 停止服務並刪除 volume / 映像
podman compose -f podman-compose.yml down --volumes --rmi all
```

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
3. 若需要在不同環境指定 API，於 `.env` 設定 `VITE_API_BASE_URL`，並在 `riskApi.js` 讀取。

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

預設使用 SQLite，資料檔案位置為 `backend/dev.db`。以下為常用查詢：

```bash
cd backend
sqlite3 dev.db ".tables"
# alembic_version  assessment_factors  assessments  users

sqlite3 dev.db "SELECT id, level_code, risk_factor_count, created_at FROM assessments ORDER BY id DESC LIMIT 3;"
# 範例輸出
# 7|high|3|2025-10-26 15:10:42.123456

sqlite3 dev.db "SELECT code, present FROM assessment_factors WHERE assessment_id = 7;"
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

- 調整 `DATABASE_URL`、`VITE_API_BASE_URL` 以符合雲端環境。
- 確認 Alembic 遷移已套用至正式資料庫。
- 若前後端分開部署，前端需移除開發用 proxy，並透過環境變數指向後端 URL。
- FastAPI 建議使用 `uvicorn --host 0.0.0.0 --port 8000` 搭配 `gunicorn` 或容器化進行部署，並配置 SSL / 反向代理。
- 記錄重複請求防護：`Step4_Report.jsx` 透過 `hasRequestedRef` 避免重複呼叫，若改動該步驟需維持相同保護。

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

保持 README 與程式碼同步，新增功能或調整流程後，請更新上述指令與索引。***
