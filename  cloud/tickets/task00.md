```bash
export PROJECT_ID="cj-demo-123"          # 你的 GCP 專案 ID
export REGION="asia-east1"               # Cloud Run / Artifact Registry / Cloud SQL 同一區域
export ARTIFACT_REPO="cj-repo"           # Artifact Registry 儲存庫名稱
export CLOUD_SQL_INSTANCE="cj-sql"       # 之前建立的 Cloud SQL instance ID
export DB_NAME="cj_app"
export DB_USER="cj_user"
export RUN_SERVICE_BACKEND="cj-backend"
export RUN_SERVICE_FRONTEND="cj-frontend"
export RUN_SA="cj-cloudrun-sa"

# 1. 讓 Podman 可以推送到 Artifact Registry
# Cloud Run 只能拉取你放在 Artifact Registry 的映像，因此需要讓 Podman 對 Registry 做一次登入。流程是使用 gcloud 幫你產生 access token，直接餵給 podman login

gcloud auth print-access-token \
  | podman login -u oauth2accesstoken --password-stdin \
    https://asia-east1-docker.pkg.dev

# 2. 建置後端映像（Podman）
# 邏輯：podman build → 打上版本 tag → podman push。建議用 Git 短 SHA 或日期作為 tag；以下示範用 Git 短 SHA：

BACKEND_TAG=$(git rev-parse --short HEAD)
podman build \
  -f backend/Dockerfile \
  -t asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-backend:${BACKEND_TAG} \
  backend

# Push 到 Artifact Registry：
podman push asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-backend:${BACKEND_TAG}

# 3. 建置前端映像（Podman）
FRONTEND_TAG=$(git rev-parse --short HEAD)
podman build \
  -f Dockerfile.frontend \
  -t asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-frontend:${FRONTEND_TAG} \
  .

podman push asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-frontend:${FRONTEND_TAG}


# 4. 部署 Cloud Run ─ 後端優先
# 4.1 先準備環境變數
# DATABASE_URL 需要使用 Cloud SQL Proxy 連線字串。
# 形式：postgresql+psycopg://<user>:<password>@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}
# 假設你暫時用之前建立的密碼 TempPass#2025：
export DATABASE_URL="postgresql+psycopg://${DB_USER}:TempPass#2025@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}"
export ADMIN_JWT_SECRET=$(openssl rand -hex 32)
export ALLOW_ORIGINS="*"

# 4.2 部署指令
gcloud run deploy ${RUN_SERVICE_BACKEND} \
  --image=asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-backend:${BACKEND_TAG} \
  --region=${REGION} \
  --service-account=${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com \
  --add-cloudsql-instances=${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE} \
  --set-env-vars="DATABASE_URL=${DATABASE_URL},ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET},ALLOW_ORIGINS=${ALLOW_ORIGINS}" \
  --allow-unauthenticated

# 完成後，gcloud run services list 會顯示 cj-backend，並且輸出一個 HTTPS URL（記下來，稍後前端要用）。

# 5. 部署 Cloud Run ─ 前端
# 前端只要知道後端 URL 就能發 API 呼叫。假設後端 URL 是 https://cj-backend-xxxxx.a.run.app：
export BACKEND_URL="https://cj-backend-xxxxx.a.run.app"
gcloud run deploy ${RUN_SERVICE_FRONTEND} \
  --image=asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-frontend:${FRONTEND_TAG} \
  --region=${REGION} \
  --service-account=${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com \
  --set-env-vars="VITE_API_BASE=${BACKEND_URL}" \
  --allow-unauthenticated

# 這樣會得到前端的 Public URL（例如 https://cj-frontend-yyyyy.a.run.app）。
# 6. 針對後端 CORS 做最後收斂（建議）
# 當前端 URL 已固定後，建議把 ALLOW_ORIGINS 改成該網址，避免任何網站都能調用你的 API：
export ALLOW_ORIGINS="https://cj-frontend-yyyyy.a.run.app"
gcloud run deploy ${RUN_SERVICE_BACKEND} \
  --image=asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-backend:${BACKEND_TAG} \
  --region=${REGION} \
  --service-account=${RUN_SA}@${PROJECT_ID}.iam.gserviceaccount.com \
  --add-cloudsql-instances=${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE} \
  --set-env-vars="DATABASE_URL=${DATABASE_URL},ADMIN_JWT_SECRET=${ADMIN_JWT_SECRET},ALLOW_ORIGINS=${ALLOW_ORIGINS}" \
  --allow-unauthenticated

# 7. 驗證與維運
# gcloud run services list --region=${REGION} 確認服務都在。
# gcloud run services describe cj-backend --region=${REGION} 確認環境變數與 Cloud SQL 連線設定。
# gcloud sql connect ${CLOUD_SQL_INSTANCE} --user=${DB_USER} 可再次測試資料庫是否能連。
# 在瀏覽器打開前端 Cloud Run URL，確認可以呼叫後端 API。

# 如果後續要更新程式，只要重新 build/tag/push，然後再跑 gcloud run deploy ... 指向新的 tag 就能滾動更新。
```