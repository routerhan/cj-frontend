## Summary
以最小資源在 GCP 申請 Cloud Run 與 Cloud SQL，搭配 Artifact Registry 儲存映像，使用 `gcloud` 指令完成基礎設定，不引入 Terraform 或複雜網路組態。

## Why
專案使用者規模小，採用 Cloud Run 的無伺服器模式最具成本效益；透過手動 `gcloud` 腳本即可完成必要資源佈署且維護成本低。

## Scope
- 啟用 Cloud Run、Cloud SQL、Artifact Registry 相關 API。
- 建立最小化的 Artifact Registry（單一地區儲存庫）。
- 建立一個最小 Postgres Cloud SQL instance（`db-f1-micro` 或同級），同區域建立資料庫與使用者。
- 建立兩個 Cloud Run 服務（frontend 與 backend），先以 placeholder 映像部署，僅保留必要環境變數。
- 建立單一服務帳號供兩個服務使用，並賦予 `Cloud SQL Client` 與 `Artifact Registry Reader` 權限。
- 記錄前後端部署順序（先部署後端取得 URL，再部署前端並回頭收斂後端 CORS）。
- 更新文件，提供一步一步的 `gcloud` 指令清單，日後手動重建即可。

## Out of Scope
- 自動化 IaC（Terraform / Deployment Manager）。
- 進階網路（私有 IP、VPC Connector）或多環境分層。
- 日誌、監控最佳化與成本警示（後續視需要擴充）。

## Acceptance Criteria
- `gcloud services list --enabled` 可看到 `run.googleapis.com`, `sqladmin.googleapis.com`, `artifactregistry.googleapis.com` 已啟用。
- Artifact Registry 中存在名為 `cj-repo`（可調整命名）的儲存庫。
- Cloud SQL 建立完成，且使用者可透過 `gcloud sql connect` 登入。
- `gcloud run services list` 可看到 `cj-backend` 與 `cj-frontend` 兩個服務；環境變數保留 `DATABASE_URL`/`ADMIN_JWT_SECRET` 佔位設定。
- 文件記錄部署順序與後端 CORS 調整流程，確保前端 URL 就緒後能收斂允許來源。
- 文件提供從零建置的命令順序，另一位同事可依指示操作成功。

## Implementation Steps
1. **共用變數設定**
   - 在 `docs/cloud-infra.md` 新增共用變數區塊：`PROJECT_ID`, `REGION`, `ARTIFACT_REPO`, `CLOUD_SQL_INSTANCE`, `DB_NAME`, `DB_USER`, `RUN_SERVICE_BACKEND`, `RUN_SERVICE_FRONTEND`。
   - 建議使用 `asia-east1` 或 `asia-northeast1` 做為單一區域，以減少延遲與成本。
2. **啟用 API 與 Artifact Registry**
   - 執行：
     ```bash
     gcloud services enable run.googleapis.com \
       sqladmin.googleapis.com artifactregistry.googleapis.com
     ```
   - 建立儲存庫（Docker 格式）：
     ```bash
     gcloud artifacts repositories create cj-repo \
       --repository-format=docker \
       --location=${REGION} \
       --description="CJ container images"
     ```
3. **建立 Cloud SQL（Postgres）**
   - 建立 instance（最小硬體）：
     ```bash
     gcloud sql instances create ${CLOUD_SQL_INSTANCE} \
       --database-version=POSTGRES_15 \
       --tier=db-f1-micro \
       --region=${REGION}
     ```
   - 建立資料庫與使用者：
     ```bash
     gcloud sql databases create ${DB_NAME} --instance=${CLOUD_SQL_INSTANCE}
     gcloud sql users create ${DB_USER} --instance=${CLOUD_SQL_INSTANCE} --password=<GENERATED_PASSWORD>
     ```
   - 將連線字串記錄於 `docs/cloud-infra.md`，並提示日後以 Cloud Run 連線時使用 `postgresql+psycopg://...` 格式。
4. **建立專用服務帳號與權限**
   - 建立單一服務帳號（例如 `cj-cloudrun-sa`）：
     ```bash
     gcloud iam service-accounts create cj-cloudrun-sa \
       --display-name="CJ Cloud Run service account"
     ```
   - 授與必要角色：
     ```bash
     gcloud projects add-iam-policy-binding ${PROJECT_ID} \
       --member="serviceAccount:cj-cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
       --role="roles/cloudsql.client"

     gcloud projects add-iam-policy-binding ${PROJECT_ID} \
       --member="serviceAccount:cj-cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
       --role="roles/artifactregistry.reader"
     ```
5. **建立 Cloud Run 服務骨架**
   - 後端（使用預設 hello 容器）：
     ```bash
     gcloud run deploy ${RUN_SERVICE_BACKEND} \
       --image=gcr.io/cloudrun/hello \
       --region=${REGION} \
       --service-account=cj-cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com \
       --set-env-vars=DATABASE_URL=postgresql://placeholder \
       --allow-unauthenticated
     ```
     （部署後可前往 Cloud Run 控制台調整，M4 會用實際映像覆蓋）
   - 前端同理：
     ```bash
     gcloud run deploy ${RUN_SERVICE_FRONTEND} \
       --image=gcr.io/cloudrun/hello \
       --region=${REGION} \
       --service-account=cj-cloudrun-sa@${PROJECT_ID}.iam.gserviceaccount.com \
       --allow-unauthenticated
     ```
   - CORS 初期可先使用寬鬆設定（例如允許 `*` 或多個來源），待前端正式 URL 確認後於後端再次部署並收斂 `ALLOW_ORIGINS` 等環境變數。
6. **紀錄操作文件**
   - 在 `docs/cloud-infra.md` 撰寫「手動建置指令」區段，按照上述順序列出命令與需要填寫的變數。
   - 明確記錄部署順序：先部署後端取得 URL → 以此設定前端 → 前端部署後回頭更新後端 CORS。
   - 附註如何以 `gcloud sql connect` 測試資料庫、如何在 Cloud Run 介面上設定環境變數/Cloud SQL 連線（使用 Cloud Run 內建 Cloud SQL 連線設定與 `--add-cloudsql-instances` 參數於 M4）。

## Test/Validation
- 手動跑過文件內指令，確認資源建立成功且無權限錯誤。
- `gcloud sql connect ${CLOUD_SQL_INSTANCE} --user=${DB_USER}` 可登入資料庫。
- `gcloud run services describe ${RUN_SERVICE_BACKEND} --region=${REGION}` 顯示服務正常，環境變數與服務帳號設定正確。
- 文件經另一位同事照著執行後能重建環境。

Git commit message: provision cloud infra (light)
