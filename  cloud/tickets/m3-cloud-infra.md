## Summary
在 GCP 建立 Cloud Run 服務、雲端資料庫與必要網路設定，支撐前後端部署所需的基礎設施。

## Why
完整的雲端基礎設施是讓容器化服務安全連線與擴展的根基。

## Scope
- 建立前端與後端 Cloud Run 服務及對應的服務帳號。
- 配置雲端資料庫（如 Cloud SQL）與資料庫網路連線（VPC Connector 或私有 IP）。
- 設定 IAM 權限與 Secret Manager，確保服務可安全讀取機密資訊。
- 定義環境區分策略（dev/staging/prod）與資源命名規範。

## Out of Scope
- 實際部署容器映像（於後續票任務完成）。
- 長期監控或成本最佳化策略的細節實作。
- 跨雲或多區域備援設計。

## Acceptance Criteria
- GCP 專案中存在可用的 Cloud Run 服務與資料庫實例。
- 後端服務具備連線資料庫的網路路徑與授權，測試連線成功。
- Secret Manager 或等效方案已建立所需的機密鍵值並完成權限設定。
- 基礎設施配置文件化（資源、權限、建立步驟）。

## Implementation Steps
1. 建立 GCP 專案所需的 API 啟用與服務帳號。
2. 建立 Cloud SQL（或對應方案）並設定資料庫使用者與網路存取。
3. 建立前後端 Cloud Run 服務骨架與 VPC Connector，綁定服務帳號。
4. 於 Secret Manager 建立環境機密並配置 IAM 權限給 Cloud Run 服務帳號。
5. 更新文件，紀錄資源結構、命名規則與環境初始化流程。

## Test/Validation
- 使用 gcloud 或 Terraform 驗證資源建立並測試連線。
- 從後端服務帳號模擬連線資料庫，確認授權與網路設定正確。
- 執行試跑部署（可用樣板映像）測試 Cloud Run 與資料庫整合。

Git commit message: provision cloud infra
