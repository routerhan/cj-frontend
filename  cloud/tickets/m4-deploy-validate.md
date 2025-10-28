## Summary
將前後端容器部署至 Cloud Run，完成端對端驗證並建立監控與回滾流程。

## Why
驗證部署成果與操作流程可確保服務在雲端穩定運作並快速回應問題。

## Scope
- 將容器映像推送至 Artifact Registry 並部署到 Cloud Run 服務。
- 配置自訂網域或預設網址，並確保 HTTPS 可用。
- 執行問卷提交、管理者登入與 CRUD 的端對端測試。
- 建立部署檢查清單、監控／日誌檢視與回滾指引。

## Out of Scope
- 架設持續部署流水線（僅文件化手動流程）。
- 大規模效能測試或壓力測試。
- 部署後的行銷或使用者溝通計畫。

## Acceptance Criteria
- 前端與後端服務可透過公開網址訪問，HTTPS 正常。
- 問卷與儀表板操作於雲端環境全數通過測試。
- 部署文檔包含部署步驟、驗證清單與回滾步驟。
- 日誌與監控連結（如 Cloud Logging、Error Reporting）已紀錄可用。

## Implementation Steps
1. 建置並推送前後端映像至 Artifact Registry。
2. 使用 gcloud 或 Terraform 部署映像至既有 Cloud Run 服務並套用必要環境變數。
3. 綁定網域與 SSL，更新前端設定與文件。
4. 執行端對端驗證腳本，紀錄測試結果與問題排除。
5. 撰寫部署完成報告，包含監控設定與回滾流程。

## Test/Validation
- 使用自動化腳本或手動流程測試問卷與儀表板關鍵路徑。
- 檢查 Cloud Run 狀態、日誌與監控警示設定。
- 進行回滾演練（如回復前一版本映像）以驗證作業流程。

Git commit message: deploy cloud run
