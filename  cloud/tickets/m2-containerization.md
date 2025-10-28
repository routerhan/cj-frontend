## Summary
在 repo 中建立完整的 Docker 與 docker-compose 設定，讓 `frontend`（Vite React）與 `backend`（FastAPI）能以容器協同運作，並串接 PostgreSQL 供後端與儀表板測試。

## Why
Cloud Run 需要容器映像，透過統一的 Docker 建置流程可確保本地、CI 及雲端的一致性，也讓開發者能快速啟動整合環境。

## Scope
- 新增前後端 Dockerfile、`.dockerignore`，並優化建置階段，使映像精簡可重複利用。
- 建立 `docker-compose.yml`（放在 repo 根目錄）啟動 `frontend`、`backend`、`db`（PostgreSQL）三個服務。
- 調整後端設定，使 `backend/app/db/session.py` 讀取 `DATABASE_URL`、並確保容器啟動時可自動執行 Alembic 遷移。
- 更新文件（`README.md` 或 `backend/docs/container.md`）與 `.env` 樣板，列出必要環境變數與啟動流程。
- 確保前端容器可透過 `VITE_API_BASE_URL` 指向後端服務，完成問卷與儀表板登入測試。

## Out of Scope
- Cloud Run / Cloud Build 的部署腳本（集中於本地與容器建置）。
- 將資料庫改為托管版本（使用 docker 內的 PostgreSQL 供測試）。
- 建立 CI pipeline（留待後續擴充）。

## Acceptance Criteria
- `docker compose up --build` 可啟動全部服務，並透過 `http://localhost:5173` 使用問卷流程，`http://localhost:8000/api/admin/assessments` 需附帶 JWT 才能存取。
- 後端容器啟動時會自動執行 `alembic upgrade head`，PostgreSQL 資料落在命名 volume。
- 文件包含：必要 `.env` 範例、常用命令、故障排除、如何以容器執行測試。
- 映像以多階段建置，前端使用 `node:20-alpine` 打包 + `nginx:alpine` 提供靜態檔案，後端使用 `python:3.11-slim`（或等同）建立。

## Implementation Steps
1. **前端容器化**
   - 在 repo 根目錄新增 `Dockerfile.frontend`：第一階段使用 `node:20-alpine` 執行 `npm ci` / `npm run build`，第二階段使用 `nginx:alpine` 複製 `dist/` 到 `/usr/share/nginx/html`。
   - 建立 `frontend.nginx.conf` 放置於 `cloud/docker/`（或根目錄），設定 `try_files $uri /index.html`，並在 Dockerfile 中引用。
   - 新增 `.dockerignore`（根目錄），排除 `node_modules/`、`dist/`、`.git/` 等。
   - 在 `package.json` 添加 `build:docker`（可選）指定 `vite build --mode production`，確保建置命令固定。
2. **後端容器化**
   - 在 `backend/` 內新增 `Dockerfile`：
     - 基底 `python:3.11-slim`, 安裝系統套件 `build-essential`, `libpq-dev`.
     - 複製 `requirements.txt`、`requirements-dev.txt`，執行 `pip install --no-cache-dir -r requirements.txt`.
     - 複製 `app/`, `alembic/`, `alembic.ini`.
     - 設定 `ENV PYTHONUNBUFFERED=1`、`ENV DATABASE_URL=...` (留空由 compose 注入)。
     - ENTRYPOINT 使用 Shell Script `scripts/start.sh`（新建於 `backend/scripts/start.sh`）負責執行 `alembic upgrade head` 後再啟動 `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
   - 新增 `backend/.dockerignore` 排除 `__pycache__/`、`dev.db`、`tests/__pycache__` 等。
   - 若 `backend/requirements*.txt` 未包含 `psycopg[binary]`，確認已存在並保持版本。
3. **Compose 與環境設定**
   - 在 repo 根目錄新增 `docker-compose.yml`：
     - `db`：使用 `postgres:16-alpine`, 環境變數 `POSTGRES_USER=app`, `POSTGRES_PASSWORD=app`, `POSTGRES_DB=cardio`, 指定 volume `postgres_data`.
     - `backend`：build `./backend`, 與 `db` 同 network，設定 `DATABASE_URL=postgresql+psycopg://app:app@db:5432/cardio`, `ADMIN_JWT_SECRET`, `ADMIN_TOKEN_TTL_MINUTES`.
     - `frontend`：build 使用 `Dockerfile.frontend`, 對外暴露 `5173` 或 `8080`（依 nginx），設定 `VITE_API_BASE_URL=http://localhost:8000`.
     - 新增 `depends_on` 與 `healthcheck`（`backend` 等待 `db` ready, `frontend` 取決於 `backend`）。
   - 建立 `.env.docker.example`，列出 `DATABASE_URL`、`ADMIN_JWT_SECRET`、`ADMIN_DEFAULT_EMAIL`、`ADMIN_DEFAULT_PASSWORD` 等供使用者覆寫。
4. **後端程式調整**
   - 更新 `backend/app/db/session.py`，將 engine 建立改為延遲：`engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)`，並針對 PostgreSQL 移除 `check_same_thread`。
   - 在 `backend/app/main.py` 加入 CORS 設定（若未存在）允許前端容器來源，並設定 `root_path` 透過環境變數控制。
   - 新增啟動腳本 `backend/scripts/start.sh`（記得 `chmod +x`），內容：
     ```bash
     #!/bin/sh
     set -e
     alembic upgrade head
     exec uvicorn app.main:app --host 0.0.0.0 --port 8000
     ```
5. **文件與開發流程**
   - 在 `README.md` 或新增 `docs/docker.md` 說明：
     - 先複製 `.env.docker.example` 為 `.env.docker`.
     - 如何使用 `docker compose up --build`.
     - 如何進入後端容器 `docker compose exec backend bash` 執行 `pytest` 或產生管理員。
     - 常見問題（如 PostgreSQL 權限、port 衝突等）。
   - 若需要種子管理員，於 M1 產生的指令加入 docker-compose 文件中供參考。
6. **整合測試**
   - 建立 `cloud/scripts/wait-for-db.sh`（或使用現有工具）在 `backend` 容器啟動前等待 `db` ready，並在 Dockerfile 中 COPY。
   - 在 `backend/tests/` 新增 e2e 測試腳本（可重用 M1 fixtures），於容器內執行 `pytest` 確認問卷與儀表板流程。
   - 驗證前端 Nginx Proxy 是否將 API 請求轉向 `VITE_API_BASE_URL`，必要時在 `frontend` Dockerfile 設定 `envsubst` 注入。

## Test/Validation
- 執行 `docker compose up --build`，確認前端頁面可正常載入、問卷送出、管理者登入與查詢資料。
- `docker compose exec backend pytest` 全數通過。
- `docker compose logs backend` 無 Alembic 失敗或資料庫連線錯誤。
- 測試停止並重啟（`docker compose down -v && docker compose up`），資料持續儲存在 `postgres_data` volume。

Git commit message: docker local stack
