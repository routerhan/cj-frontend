## Summary
使用 Cloud Build / gcloud 將前後端容器映像推送至 Artifact Registry，部署到既有 Cloud Run 服務，並完成端對端驗證、監控設定與回滾流程。

## Why
基礎設施完成後，必須將實際映像部署並驗證全流程；同時建立部署腳本與檢查清單，才能快速迭代與回復問題。

## Scope
- 在 `cloud/deploy/` 建立部署腳本（Shell 或 Makefile），含映像建置、推送、Cloud Run 更新、秘密綁定與回滾指令。
- 使用 `gcloud builds submit` 或本地 `docker build` + `gcloud run deploy` 為前後端服務完成部署。
- 設定 HTTPS 網域（可先使用預設 *.run.app 網域，再記錄自訂網域綁定步驟）與健康檢查。
- 整理部署後的驗證清單、日誌檢視、指標監控與回滾流程，寫入 `docs/deploy-checklist.md`。

## Out of Scope
- 建置完整 CI/CD pipeline（僅提供手動腳本，可為日後自動化鋪路）。
- 進行壓力測試或安全掃描（可列為部署後建議事項）。
- 第三方監控/警示整合（如 Datadog、PagerDuty）。

## Acceptance Criteria
- Artifact Registry 內存在最新 `frontend:release-<tag>` 與 `backend:release-<tag>` 映像，Cloud Run 服務已更新至該版本。
- 後端 Cloud Run 服務透過 VPC Connector 成功連線 Cloud SQL，問卷提交與儀表板登入皆成功。
- 部署腳本支援 `deploy-frontend`, `deploy-backend`, `rollback-frontend`, `rollback-backend` 等指令，並在 README/文件中說明使用方式。
- `docs/deploy-checklist.md` 點出部署前檢查、部署步驟、驗證項目、回滾流程、日誌/監控入口連結。
- Cloud Logging、Cloud Monitoring Dashboards 或基本指標已確認可讀取。

## Implementation Steps
1. **部署腳本與設定**
   - 建立 `cloud/deploy/config.sh` 定義共用變數：`PROJECT_ID`, `REGION`, `FRONTEND_SERVICE`, `BACKEND_SERVICE`, `ARTIFACT_REPO`, `IMAGE_TAG=$(date +%Y%m%d-%H%M)`.
   - 新增 `cloud/deploy/build_frontend.sh`：包裝 `docker build -f Dockerfile.frontend -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/frontend:${IMAGE_TAG} .` 與 `docker push`。
   - 新增 `cloud/deploy/build_backend.sh`：同理建置後端映像。
   - 建立 `cloud/deploy/deploy_frontend.sh` 和 `deploy_backend.sh`，分別呼叫：
     ```bash
     gcloud run deploy ${FRONTEND_SERVICE} \
       --image=${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/frontend:${IMAGE_TAG} \
       --region=${REGION} \
       --service-account=${FRONTEND_SA} \
       --allow-unauthenticated
     ```
     後端部署需加上 `--vpc-connector`, `--set-secrets`, `--execution-environment=gen2`.
   - 若使用 Cloud Build，建立 `cloud/deploy/cloudbuild-frontend.yaml` / `cloudbuild-backend.yaml`，在部署腳本中透過 `gcloud builds submit --config` 執行。
2. **環境變數與秘密綁定**
   - 後端部署使用 `--set-secrets=DATABASE_URL=projects/.../secrets/database-url:latest,ADMIN_JWT_SECRET=projects/.../secrets/admin-jwt-secret:latest`.
   - 需要額外環境變數（如 `ADMIN_TOKEN_TTL_MINUTES`），使用 `--set-env-vars`.
   - 前端部署若需設定 API endpoint，可在建置階段透過 `envsubst` 或 `.env.production` 注入 `VITE_API_BASE_URL=https://<backend-run-url>`.
3. **自訂網域與 HTTPS**
   - 若有自訂網域：使用 `gcloud run domain-mappings create --service ${FRONTEND_SERVICE} --domain app.example.com`.
   - 完成 Cloud DNS 驗證並在文件中記錄步驟與 TTL 建議。
   - 若暫無自訂網域，記錄預設 `https://<service>-<hash>-<region>.run.app` URL，供前端設定與驗證。
4. **端對端驗證**
   - 撰寫 `cloud/deploy/smoke_tests.http`（或 Postman Collection）覆蓋：
     1. `POST /api/risk-assessment`（應回傳 200 與評估內容）。
     2. `POST /api/admin/login` → 取得 JWT。
     3. `GET /api/admin/assessments` 搭配 Authorization header。
   - 在 `cloud/deploy/run_smoke_tests.sh` 使用 `newman` 或 `curl` + `jq` 執行上述流程，成功才算部署完成。
   - 手動於瀏覽器訪問儀表板 URL，確認跳轉登入、登入成功後可讀取資料。
5. **監控、日誌與回滾文檔**
   - 建立 `docs/deploy-checklist.md`，內容包含：
     - 部署前檢查（Terraform 狀態、Secrets、service account 權限、gcloud auth）。
     - 部署指令清單（frontend/backend build + deploy）。
     - 驗證項目（`curl` 回應、Smoke test、UI 操作）。
     - 回滾指令（`gcloud run services update --image=<previous>`）。
     - Cloud Logging / Monitoring / Error Reporting 入口連結與操作說明。
   - 在文件中加入建議監控指標：請求延遲 95th percentile、HTTP 4xx/5xx、Cloud SQL 連線數。

## Test/Validation
- 本地或 CI 執行 `cloud/deploy/build_backend.sh`、`deploy_backend.sh`，確認腳本無錯並成功部署。
- 完成部署後執行 `cloud/deploy/run_smoke_tests.sh`，所有測試皆通過。
- 使用 `gcloud run services describe <service>`，檢查修訂版本為最新 IMAGE_TAG 且環境變數/秘密綁定正確。
- 在 Cloud Logging 查詢最新修訂產生的日誌，確保無啟動錯誤；於 Cloud Monitoring 建立簡易儀表板並截圖貼入文件（或提供儀表板連結）。
- 嘗試回滾：使用 `gcloud run services list-revisions` 找出上一版，執行 `gcloud run services update-traffic --to-revisions=REVISION=100` 確認回滾流程可行。

Git commit message: deploy cloud run
