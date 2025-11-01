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

```