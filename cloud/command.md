# Cloud Deployment Command Reference

This guide documents the commands and environment variables used to build, deploy, and provision the unified Cloud Run service.

## Environment Setup

```bash
export PROJECT_ID="cj-demo-123"          # GCP project identifier
export REGION="asia-east1"               # Deployment region for Cloud Build/Run/SQL
export ARTIFACT_REPO="cj-repo"           # Artifact Registry repository name
export CLOUD_SQL_INSTANCE="cj-sql"       # Cloud SQL instance (without project/region prefix)
export DB_NAME="cj_app"                  # Cloud SQL database name
export DB_USER="cj_user"                 # Cloud SQL user name
export DB_PASSWORD="TempPass#2025"       # Cloud SQL user password (consider Secret Manager in production)
export ADMIN_JWT_SECRET="4cccb9361fbce358e27cc788953c8fe98ace13adf4b4ef79d03ddcdd745be77d"  # JWT signing secret
export _SERVICE_IMAGE="asia-east1-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REPO}/cj-service:latest"  # Fully qualified image tag
```

> 建議將 `DB_PASSWORD`、`ADMIN_JWT_SECRET` 放入 Secret Manager，命令示例使用環境變數以方便快速測試。

## Build Container Image

```bash
gcloud builds submit \
  --config cloud/cloudbuild.yaml \
  --substitutions=_SERVICE_IMAGE="${_SERVICE_IMAGE}"
```

- 透過 Cloud Build 使用 `cloud/cloudbuild.yaml` 建置單一容器映像並推送到 Artifact Registry。
- `_SERVICE_IMAGE` 指向部署使用的最終映像 tag。

## Deploy Cloud Run Service

```bash
gcloud run deploy cj-service \
  --image "${_SERVICE_IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --add-cloudsql-instances "${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}" \
  --set-env-vars DATABASE_URL="postgresql+psycopg://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}",ADMIN_JWT_SECRET="${ADMIN_JWT_SECRET}",ADMIN_TOKEN_TTL_MINUTES="60"
```

- 部署 Cloud Run 服務 `cj-service`，使用最新映像並連結 Cloud SQL 實例。
- `DATABASE_URL` 採 Cloud SQL Unix socket 格式，`ADMIN_JWT_SECRET` 提供後端簽發 JWT 所需的密鑰。
- `ADMIN_TOKEN_TTL_MINUTES` 設定管理者登入 token 的存活時間。

## Provision Admin Account via Cloud Run Job

### Create Job

```bash
gcloud run jobs create cj-create-admin \
  --image "${_SERVICE_IMAGE}" \
  --region "${REGION}" \
  --set-env-vars DATABASE_URL="postgresql+psycopg://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}",ADMIN_JWT_SECRET="${ADMIN_JWT_SECRET}" \
  --set-cloudsql-instances "${PROJECT_ID}:${REGION}:${CLOUD_SQL_INSTANCE}" \
  --command python \
  --args=-m,scripts.create_admin,admin@example.com,--password,StrongPass123!
```

- 建立 Cloud Run Job `cj-create-admin`，共用相同映像與環境設定。
- Job 會執行 `python -m scripts.create_admin ...` 建立或重設管理者帳號，必要時可改用 `--reactivate`。

### Execute Job

```bash
gcloud run jobs execute cj-create-admin --region "${REGION}"
```

- 執行 Job 以套用管理者帳號變更，完成後可在 Cloud Run → Jobs 或使用 `gcloud run jobs executions list` 查核結果。

---

完成上述流程後，即可使用 `https://<Cloud-Run-URL>/api/admin/dashboard` 透過 `admin@example.com / StrongPass123!` 登入儀表板，並保持建置與部署步驟紀錄以利未來維運。***
