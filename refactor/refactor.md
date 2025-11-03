# Refactor Proposal — Consolidate Frontend & Backend into a Single Cloud Run Service

## 1. 為什麼要調整？
- 目前架構：React/Vite 前端 (`Dockerfile.frontend`) + FastAPI 後端 (`backend/Dockerfile`) 分別部署為兩個 Cloud Run 服務，彼此透過 HTTP 溝通。
- 實際痛點  
  - 需要維護兩個映像檔、兩段部署流程與環境變數。  
  - Cloud Run 間的 proxy 設定（`BACKEND_URL`、CORS、Nginx buffer）帶來額外維護成本。  
- 新目標：將「靜態前端頁面 + 後端 API + Cloud SQL 存取」整合到 **單一容器** 與 **單一 Cloud Run 服務**，降低部署與維運複雜度。

> 仍然要保留後端：React 無法安全地直接連資料庫，所有資料寫入與商業邏輯應在後端執行。

---

## 2. 整體構想概述
1. **Docker 多階段建置**
   - **Stage 1：Frontend builder** 使用 Node 20 建置 `npm ci && npm run build`，輸出 `dist/`。
   - **Stage 2：Python builder** 安裝 FastAPI 需求 (`pip install -r requirements.txt`)。
   - **Stage 3：Runtime** 基於精簡 Python 映像，複製 Stage2 的 site-packages、backend 程式碼、以及 Stage1 的 `dist/`。執行 `backend/scripts/start.sh`。
2. **FastAPI 提供靜態檔**
   - 在 `backend/app/main.py` 中掛載 React build 後的檔案，例如 `app.mount("/", StaticFiles(directory="app/frontend", html=True), name="frontend")`，並處理 SPA fallback（訪問 `/some-path` 時回傳 `index.html`）。
3. **保留後端邏輯與資料庫流程**
   - `alembic upgrade head` 仍由 `backend/scripts/start.sh` 觸發。
   - API 路徑繼續掛在 `/api/*`。
4. **部署流程**
   - Cloud Build 只建置一次映像 → push 到 Artifact Registry → Cloud Run deploy，一並設定 `DATABASE_URL`、`ADMIN_JWT_SECRET` 等環境變數與 `--add-cloudsql-instances`。

---

## 3. 詳細實作步驟與影響檔案

### 3.1 Docker 與建置流程
- **新增** 共同的 `Dockerfile`（建議放在 repo root，取代原先的 `Dockerfile.frontend` 與 `backend/Dockerfile`）。  
  - Stage `frontend_builder`: `FROM node:20-alpine`, 複製 `package*.json` → `npm ci` → 複製前端程式 → `npm run build`。  
  - Stage `python_builder`: `FROM python:3.11-slim`, 安裝 build tools (`build-essential`, `libpq-dev`)，`pip install -r backend/requirements.txt`。  
  - Stage `runtime`: `FROM python:3.11-slim`, 複製 site-packages、`backend/` 程式碼、React `dist/` → 放到 `backend/app/frontend/` 或 `backend/app/static/`。  
  - 針對 `backend/scripts/start.sh`：保留目前的 DB migration + uvicorn 啟動（記得 `PORT=${PORT:-8080}` 已經就緒）。  
  - 以 `CMD ["/start.sh"]` 或相同邏輯啟動。
- **移除** 不再使用的 `Dockerfile.frontend`、`backend/Dockerfile`（或至少註明廢棄）以避免混淆。  
- **Cloud Build（若使用）**：新增或更新 `cloud/cloudbuild.yaml`，只需要 `docker build -t ... -f Dockerfile .` 的單一指令，無需再分 frontend/backend config。

### 3.2 FastAPI 服務前端靜態檔
- **修改** `backend/app/main.py`：  
  ```python
  from fastapi import FastAPI
  from fastapi.staticfiles import StaticFiles
  from fastapi.responses import FileResponse
  from pathlib import Path

  FRONTEND_DIST = Path(__file__).parent / "frontend"  # docker build 時把 dist/ 放到這裡

  def create_app() -> FastAPI:
      app = FastAPI(title="Cardiovascular Risk Assessment API", version="0.1.0")
      app.include_router(api_router)

      if FRONTEND_DIST.exists():
          app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

          @app.get("/", include_in_schema=False)
          async def serve_index():
              return FileResponse(FRONTEND_DIST / "index.html")

          @app.get("/{full_path:path}", include_in_schema=False)
          async def serve_spa(full_path: str):
              target = FRONTEND_DIST / full_path
              if target.exists():
                  return FileResponse(target)
              return FileResponse(FRONTEND_DIST / "index.html")
      return app
  ```
  > 依實際狀況決定要不要 mount `/assets` 或直接 mount 整個 `StaticFiles(directory=FRONTEND_DIST, html=True)`。

### 3.3 程式碼清理與結構調整
- **backend/app/**  
  - 新增 `frontend/` 目錄（React build output 的放置點，Docker build 時覆蓋）。  
  - 確保 `.gitignore` 忽略 build 產物（可在 root `.gitignore` 加上 `backend/app/frontend/`）。  
- **前端程式碼 (`src/utils/riskApi.js` 等)**  
  - API base URL 已改成同源，所以繼續使用 `fetch('/api/...')`，不需要額外調整。  
- **README / docs**  
  - 更新開發與部署指南：  
    - 本地開發：可以保留原本「前端 `npm run dev` + 後端 uvicorn」流程，或新增 `scripts/dev.sh` 方便一起啟動。  
    - 部署流程：Cloud Build → Artifact Registry → Cloud Run → 指定 `DATABASE_URL` 等變數。

### 3.4 環境變數與設定
- Cloud Run 服務只需要：`DATABASE_URL`、`ADMIN_JWT_SECRET`、`ALLOW_ORIGINS`（如仍需 CORS 控制）等後端變數。  
- 不再需要 `BACKEND_URL`、`VITE_API_BASE`。  
- 確保 `DATABASE_URL` 使用 Cloud SQL Proxy 格式：`postgresql+psycopg://user:password@/${DB_NAME}?host=/cloudsql/${PROJECT}:${REGION}:${INSTANCE}`。

---

## 4. 測試與驗證
1. **本地整合測試**
   - `npm run build` → `uvicorn backend.app.main:app --reload` → 確認 http://localhost:8000 可同時顯示 UI + API。  
   - 或建立 `Makefile`/`scripts/dev.sh` 自動化上述流程。  
2. **自動測試**  
   - 在 Docker build 或 CI Pipeline 中執行 `npm test`、`python -m pytest backend/tests`。  
3. **Cloud Run 測試**  
   - 部署後，透過 `curl https://<service-url>/api/risk-assessment` 確認 API 存活。  
   - 打開前端網址，走完整問卷流程，確認 API 寫入 DB、Cloud SQL 中有資料。  
   - 監看 Cloud Run log（尤其是 `/start.sh` Alembic log）確保啟動流程成功，無長時間卡住。

---

## 5. 風險與開發注意事項
- **容器體積**：因為同時包含 Node + Python 依賴，映像體積會增加；若需要可以考慮 docker layer cache 或使用 builder pattern 減少最終體積。  
- **建置時間**：每次 build 都會跑 `npm ci` + `pip install`，可透過 Cloud Build cache 或 Artifact Registry base image 優化。  
- **前端 dev workflow**：整合後仍建議保留原有的 `npm run dev` + `uvicorn --reload` 模式，以免每次改 UI 都得重建 Docker。  
- **資料庫 migration**：首次啟動仍由 `start.sh` 跑 Alembic；可考慮在 Cloud SQL 中預先建表，或提高 Cloud Run timeout。  
- **資源配置**：單服務共用 CPU/RAM，若後端計算量突然變大，可能影響前端回應；需在 Cloud Run 調整 memory/cpu 或增加 autoscaling 上限。

---

## 6. 待辦清單總覽
1. **Docker**  
   - [ ] 新增單一 `Dockerfile`，移除舊的 front/back Dockerfile。  
   - [ ] 調整 Cloud Build pipeline（`cloud/cloudbuild.yaml`）。  
2. **FastAPI**  
   - [ ] 修改 `backend/app/main.py` 掛載 React 靜態檔並提供 SPA fallback。  
   - [ ] 更新 `.gitignore` 忽略 `backend/app/frontend/`。  
3. **Scripts**  
   - [ ] 確認 `backend/scripts/start.sh` 無需調整，或視需求新增環境變數。  
4. **文檔**  
   - [ ] 更新 `README` 與 `docs/`，描述新的 build/deploy 流程。  
   - [ ] 在 `plan.md` / `refactor.md` 記錄變動與指引。  
5. **測試**  
   - [ ] 本地確認 `npm run build` + `uvicorn` 流程可跑。  
   - [ ] 執行 `pytest`、`npm test`。  
6. **部署**  
   - [ ] Cloud Build → Artifact Registry → Cloud Run 部署。  
   - [ ] 驗證 Cloud Run log、UI 功能、DB 寫入均正常。  
   - [ ] 移除舊的 `cj-frontend` Cloud Run 服務（或保留觀察一段時間再刪）。

---

## 7. 開放議題
- 是否需要保留 `docker-compose` 在本地同時跑 React dev server + FastAPI？若需要，可新增 dev-only compose 定義。  
- 若擔心容器過大，可研究 multi-stage 最終使用 `python:3.11-slim` + `npm run build` 產物 + `pip install --no-cache-dir` 降少映像。  
- Alembic migration 若太耗時，可改成手動操作或在 CI 先跑一次。  
- Cloud SQL 的密碼/連線是否放在 Secret Manager？整合後 Service Account/環境變數配置需調一次。

---

以上是單容器整合方案的完整設計。請覆核後，如無問題，再逐步落地實作。完成後將不再需要額外管理前端 Cloud Run 服務，也能避免 proxy/CORS 相關設定。祝開發順利！ 🚀

