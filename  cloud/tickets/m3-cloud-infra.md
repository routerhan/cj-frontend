## Summary
以 Terraform 與 gcloud 腳本在 GCP 建立 Cloud Run 服務、Cloud SQL、VPC Connector、Secret Manager 與必要 IAM，為容器部署提供穩定基礎設施。

## Why
僅有容器並不足以部署；需要一致的基礎資源與權限配置，確保後端能安全連線資料庫、存取機密並區分環境。

## Scope
- 在 repo 新增 `cloud/infra/gcp/` Terraform 專案，定義專案、網路、Cloud SQL、Cloud Run、Artifact Registry、Secret Manager、IAM 等資源。
- 提供 `env/dev.tfvars`、`env/staging.tfvars` 等設定檔，與 `Makefile` 或 `taskfile` 簡化 `terraform plan/apply`。
- 建立 `scripts/enable-apis.sh` 與 `scripts/create-service-accounts.sh`，啟用必要 API (`run.googleapis.com`, `sqladmin.googleapis.com`, `artifactregistry.googleapis.com`, `secretmanager.googleapis.com`, `cloudbuild.googleapis.com`) 並建立/綁定服務帳號。
- 于 `backend/app/db/session.py` 記錄需要的 `DATABASE_URL` 標準格式，並在文件中描述 Cloud SQL 連線方式（私有 IP + VPC Connector）。
- Secret Manager 中建立 `admin-jwt-secret`、`database-url` 等鍵值並設定 Cloud Run 取用權限。

## Out of Scope
- 實際推送映像或部署服務（由 M4 處理）。
- 高可用跨區架構、成本監控與警示細節（僅建立基本資源）。
- 非 GCP 環境的 IaC（專注 GCP）。

## Acceptance Criteria
- Terraform 專案可在本地執行 `terraform plan`、`terraform apply`，建立或更新以下資源：
  - Artifact Registry 儲存庫（region 例如 `asia-east1`）。
  - Cloud SQL Postgres 實例（私有 IP、指定資料庫、使用者）。
  - VPC、Connector 及防火牆規則，允許 Cloud Run 連線 Cloud SQL。
  - 前後端 Cloud Run 服務骨架（未部署映像但已存在設定）。
  - Secret Manager 秘密及 IAM 綁定（Cloud Run SA 可訪問）。
- 所有服務帳號（`cloud-run-backend@...`, `cloud-run-frontend@...`, `terraform@...` 等）具備最小必要權限。
- 在 `docs/cloud-infra.md`（新建或更新）中列出命名規則、環境區分策略、Terraform 目錄結構與操作流程。

## Implementation Steps
1. **Terraform 專案架構**
   - 建立 `cloud/infra/gcp/{main.tf, variables.tf, outputs.tf, providers.tf}`。
   - 在 `main.tf` 引入模組或直接定義：
     - `google_project_service` 啟用 API。
     - `google_artifact_registry_repository`。
     - `google_sql_database_instance`、`google_sql_database`、`google_sql_user`。
     - `google_compute_network`、`google_compute_subnetwork`、`google_vpc_access_connector`。
     - `google_service_account` 與對應 `google_project_iam_binding`。
     - `google_cloud_run_service`（先使用固定映像 `gcr.io/cloudrun/hello` 占位）。
     - `google_secret_manager_secret` 與 `secret_version`。
   - 在 `variables.tf` 定義 `project_id`、`region`、`db_tier`、`env` 等變數；在 `env/dev.tfvars` 寫入預設值。
2. **API 與帳號腳本**
   - 新增 `cloud/scripts/enable-apis.sh`，內容使用 `gcloud services enable ...`。
   - 新增 `cloud/scripts/create-service-accounts.sh` 建立 `cloud-run-backend`, `cloud-run-frontend`, `terraform` SA，並透過 `gcloud iam service-accounts keys create` 下載 key（寫入 `.gitignore`）。
   - 在 `docs/cloud-infra.md` 說明執行順序：`./cloud/scripts/enable-apis.sh` → `./cloud/scripts/create-service-accounts.sh` → `terraform init/plan/apply`。
3. **Cloud SQL 連線設計**
   - Terraform 中為 Cloud SQL 啟用私有 IP (`ip_configuration.private_network` 指向 VPC)。
   - VPC Connector 指定 `/28` 子網，region 與 Cloud Run 一致。
   - 在 `cloud/infra/gcp/main.tf` 中為 Cloud Run 設定 `ingress = "internal-and-cloud-load-balancing"`（後端）與 `vpc_connector`。
   - `backend` 將使用 `DATABASE_URL=postgresql+psycopg://<user>:<password>@<private-ip>:5432/<db>` 透過 Secret 注入。
4. **Secret 與環境變數**
   - Terraform 建立 `google_secret_manager_secret`（`admin-jwt-secret`, `database-url`, `frontend-env` 等）。
   - `google_secret_manager_secret_version` 將初始值（可由 Terraform `random_password` 產生）與 `locals` 注入。
   - Cloud Run 服務設定 `template.spec.containers.env` 使用 `secret_manager` 引用（或在 M4 部署時以 gcloud 指定）。
5. **IAM 綁定**
   - 使用 `google_project_iam_member` 將 `cloud-run-backend` SA 綁定 `roles/cloudsql.client`, `roles/secretmanager.secretAccessor`, `roles/logging.logWriter`。
   - `cloud-run-frontend` SA 綁定 `roles/artifactregistry.reader`, `roles/run.invoker`（若需）。
   - `terraform` SA 具備 `roles/editor` 或拆分權限，並在文件中提示使用者最小權限原則。
6. **文件與驗證**
   - 更新 `docs/cloud-infra.md`：描述 Terraform 變數、命令、狀態檔管理（可考慮使用 `gcs` backend）。
   - 在文件中加入命名規範（`cj-{env}-{resource}`）、環境分支策略與 `terraform workspace` 用法。

## Test/Validation
- 執行 `terraform init`、`terraform validate`、`terraform plan -var-file=env/dev.tfvars` 確認無錯。
- `terraform apply` 後使用 `gcloud sql instances describe`, `gcloud run services list`, `gcloud secrets versions access` 驗證資源存在。
- 透過 Cloud Run 後端服務帳號，使用 `gcloud auth activate-service-account --key-file=...` 並測試 `psql "sslmode=disable hostaddr=<private-ip>"` 成功連線。
- `gcloud run services update backend --set-secrets`（dry-run 或 staging）確認 Secret 綁定可用。
- 文件內列出的流程由另一位成員跟著操作可重現環境。

Git commit message: provision cloud infra
