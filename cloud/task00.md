```bash
export PROJECT_ID="cj-demo-123"
export REGION="asia-east1"
export ARTIFACT_REPO="cj-repo"
export CLOUD_SQL_INSTANCE="cj-sql"
export DB_NAME="cj_app"
export DB_USER="cj_user"
export ADMIN_JWT_SECRET=4cccb9361fbce358e27cc788953c8fe98ace13adf4b4ef79d03ddcdd745be77d
export DB_PASSWORD="TempPass#2025"
export _SERVICE_IMAGE=asia-east1-docker.pkg.dev/cj-demo-123/cj-repo/cj-service:latest

gcloud builds submit \
  --config cloud/cloudbuild.yaml \
  --substitutions=_SERVICE_IMAGE=asia-east1-docker.pkg.dev/cj-demo-123/cj-repo/cj-service:latest



# 4. 部署 Cloud Run 
# 4.1 先準備環境變數
# DATABASE_URL 需要使用 Cloud SQL Proxy 連線字串。
# 形式：postgresql+psycopg://<user>:<password>@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}
# 假設你暫時用之前建立的密碼 TempPass#2025：
export DATABASE_URL="postgresql+psycopg://${DB_USER}:TempPass#2025@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}"
# export ADMIN_JWT_SECRET=$(openssl rand -hex 32) 
export ADMIN_JWT_SECRET=4cccb9361fbce358e27cc788953c8fe98ace13adf4b4ef79d03ddcdd745be77d
export DB_PASSWORD="TempPass#2025"



# 7. 驗證與維運
# gcloud run services list --region=${REGION} 確認服務都在。
# gcloud run services describe cj-backend --region=${REGION} 確認環境變數與 Cloud SQL 連線設定。
# gcloud sql connect ${CLOUD_SQL_INSTANCE} --user=${DB_USER} 可再次測試資料庫是否能連。
# 在瀏覽器打開前端 Cloud Run URL，確認可以呼叫後端 API。

# 如果後續要更新程式，只要重新 build/tag/push，然後再跑 gcloud run deploy ... 指向新的 tag 就能滾動更新。
```

gcloud run deploy cj-service \
  --image asia-east1-docker.pkg.dev/cj-demo-123/cj-repo/cj-service:latest \
  --region asia-east1 \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances cj-demo-123:asia-east1:cj-sql \
  --set-env-vars DATABASE_URL="postgresql+psycopg://cj_user:TempPass#2025@/cj_app?host=/cloudsql/cj-demo-123:asia-east1:cj-sql",ADMIN_JWT_SECRET="4cccb9361fbce358e27cc788953c8fe98ace13adf4b4ef79d03ddcdd745be77d",ADMIN_TOKEN_TTL_MINUTES="60"

gcloud run jobs create cj-create-admin \
  --image asia-east1-docker.pkg.dev/cj-demo-123/cj-repo/cj-service:latest \
  --region asia-east1 \
  --set-env-vars DATABASE_URL="postgresql+psycopg://cj_user:TempPass#2025@/cj_app?host=/cloudsql/cj-demo-123:asia-east1:cj-sql",ADMIN_JWT_SECRET="4cccb9361fbce358e27cc788953c8fe98ace13adf4b4ef79d03ddcdd745be77d" \
  --set-cloudsql-instances cj-demo-123:asia-east1:cj-sql \
  --command python \
  --args=-m,scripts.create_admin,admin@example.com,--password,StrongPass123!


gcloud run jobs execute cj-create-admin --region asia-east1
