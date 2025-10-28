## Summary
在 repo 中建立與 Cloud Run 相容的容器化設定，但本地以 Podman 進行建置與整合測試，確保最小可行流程即可模擬未來雲端部署。

## Why
本地僅有 Podman 可用，但仍需建立 OCI 映像以部署到 Cloud Run。透過簡化的 Dockerfile 與 Podman 組態，可以在本地驗證前後端互通、資料庫連線與登入流程，在雲端部署時只需最小調整。

## Scope
- 為前端與後端撰寫精簡 Dockerfile（兼容 Podman／Docker），僅保留必要步驟以生成 Cloud Run 可用映像。
- 建立 `podman-compose.yml`（或 `docker-compose.yml` 可由 Podman Compose 直接使用），啟動 `frontend`、`backend`、`db`（PostgreSQL）三服務。
- 填寫 `.env.podman.example` 指出 Cloud Run 相關重要環境變數（`VITE_API_BASE_URL`、`DATABASE_URL` 等），以利本地與雲端共用設定。
- 調整後端啟動腳本，使容器啟動時可自動執行 Alembic 遷移並連線 PostgreSQL。
- 撰寫文件描述使用 `podman build`、`podman compose up` 進行本地測試，以及映像如何推送至 Artifact Registry（延伸至 M4）。

## Out of Scope
- 依賴 Docker 專有功能（必須能被 Podman 完整支援）。
- 雲端部署指令（留待 M4）。
- 進階映像最佳化與多階段 build 的極致調整（以易懂與 Cloud Run 可運行為主）。

## Acceptance Criteria
- `podman compose up --build` 能啟動全部服務並完成問卷、管理者登入測試。
- 映像以標準 OCI 形式產出，可使用 `podman image inspect` 確認無 rootfs 欠缺，並可 `podman push` 到 `gcr.io`/Artifact Registry。
- 文檔提供 Podman 安裝、常用命令與故障排除，並說明 Cloud Run 部署時僅需替換 registry 與環境變數。
- 後端容器啟動時自動執行 `alembic upgrade head`，若資料庫未就緒會重試等待。

## Implementation Steps
1. **基礎設定**
   - 在 repo 根目錄新增 `.dockerignore`，排除 `node_modules/`、`dist/`、`.git/`、`__pycache__/`。
   - 建立 `.podmanenv`（可由 `.env.podman.example` 複製），包含：
     ```
     VITE_API_BASE_URL=http://backend:8000
     DATABASE_URL=postgresql+psycopg://app:app@db:5432/cardio
     ADMIN_JWT_SECRET=local-secret
     ADMIN_DEFAULT_EMAIL=admin@example.com
     ADMIN_DEFAULT_PASSWORD=ChangeMe123
     ```
2. **前端 Dockerfile（簡化）**
   - 新建 `Dockerfile.frontend`，內容：
     ```Dockerfile
     FROM node:20-alpine AS build
     WORKDIR /app
     COPY package*.json ./
     RUN npm ci
     COPY . .
     RUN npm run build

     FROM nginx:alpine
     COPY --from=build /app/dist /usr/share/nginx/html
     ```
   - 為避免 Podman 與 Docker 差異，使用環境變數注入 API base URL：在 `Dockerfile.frontend` 內加入 `ARG VITE_API_BASE_URL` 與 `ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}`（或建置前複製 `.env.production`）。
3. **後端 Dockerfile（精簡）**
   - 在 `backend/` 新增 `Dockerfile`：
     ```Dockerfile
     FROM python:3.11-slim
     WORKDIR /app
     ENV PYTHONUNBUFFERED=1
     COPY requirements.txt requirements.txt
     RUN pip install --no-cache-dir -r requirements.txt
     COPY . .
     COPY scripts/start.sh /start.sh
     RUN chmod +x /start.sh
     CMD ["/start.sh"]
     ```
   - 新增 `backend/scripts/start.sh`：
     ```bash
     #!/bin/sh
     set -e
     until alembic upgrade head; do
       echo "Alembic migration failed, retrying in 3s..."
       sleep 3
     done
     exec uvicorn app.main:app --host 0.0.0.0 --port 8000
     ```
4. **Podman Compose**
   - 在 repo 根目錄建立 `podman-compose.yml`（Podman 可直接讀取 Docker Compose v3）：
     ```yaml
     services:
       db:
         image: postgres:16-alpine
         environment:
           POSTGRES_USER: app
           POSTGRES_PASSWORD: app
           POSTGRES_DB: cardio
         ports:
           - "5433:5432"
         volumes:
           - postgres_data:/var/lib/postgresql/data
       backend:
         build:
           context: ./backend
         env_file: .podmanenv
         environment:
           DATABASE_URL: ${DATABASE_URL}
           ADMIN_JWT_SECRET: ${ADMIN_JWT_SECRET}
           ADMIN_DEFAULT_EMAIL: ${ADMIN_DEFAULT_EMAIL}
           ADMIN_DEFAULT_PASSWORD: ${ADMIN_DEFAULT_PASSWORD}
         depends_on:
           - db
         ports:
           - "8000:8000"
       frontend:
         build:
           context: .
           dockerfile: Dockerfile.frontend
           args:
             VITE_API_BASE_URL: http://localhost:8000
         ports:
           - "5173:80"
         depends_on:
           - backend
     volumes:
       postgres_data:
     ```
   - 若使用 `podman-compose`, 指令為 `podman-compose up --build`；若使用 `podman play kube`，可用 `podman-compose convert` 產生 K8s YAML。
5. **後端程式調整**
   - 確認 `backend/app/db/session.py` 使用 `pool_pre_ping=True` 並移除 SQLite 專用參數。
   - 如需 CORS：在 `backend/app/main.py` 加入 `from fastapi.middleware.cors import CORSMiddleware`，並允許 `http://localhost:5173`。
   - 提供啟動後初始管理員創建腳本（可從 `.podmanenv` 讀取），例如 `backend/scripts/create_admin.py`，並在啟動流程或文件提示執行。
6. **文件與命令指南**
   - 在 `docs/container-local.md` 撰寫：
     - Podman 安裝連結、`podman --version` 驗證。
     - `cp .env.podman.example .podmanenv`、`podman-compose up --build`、`podman compose down`.
     - 如何執行後端測試：`podman compose exec backend pytest`.
     - 影像推送步驟：`podman login https://asia-east1-docker.pkg.dev`, `podman tag`, `podman push`.
   - 說明 Cloud Run 與本地差異僅在環境變數及資料庫來源，映像本身無須修改。

## Test/Validation
- 本地執行 `podman compose up --build`，成功後於 `http://localhost:5173` 完成問卷與登入流程；未登入時訪問 `/api/admin/assessments` 應得 401。
- 使用 `podman compose exec backend pytest` 確認測試通過。
- `podman image save <backend-image> | skopeo inspect`（或 `podman image inspect`）確認映像符合 OCI 規範。
- 將映像 `podman push` 到測試 registry（可先推到 `gcr.io/<project-id>/sandbox`），再透過 `gcloud run deploy --image ... --dry-run` 驗證相互兼容。
- 將資料庫卷刪除後重建（`podman volume rm postgres_data`）確保遷移流程可自動重建 schema。

Git commit message: podman local stack
