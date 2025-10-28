## Summary
為前後端建立容器化流程與本地整合環境，確保服務可在 Docker 上順利協同運作。

## Why
容器化是部署至 Cloud Run 的前提，可提升環境一致性與部署效率。

## Scope
- 撰寫前端與後端的 Dockerfile，確保建置與啟動流程明確。
- 建立 docker-compose（或等效方案）以模擬前後端與資料庫協作。
- 定義並文件化必要的環境變數與秘密參數。
- 確認前端容器可呼叫後端 API，後端容器可連線到本地或測試資料庫。

## Out of Scope
- 設定雲端基礎設施或 Cloud Run 服務。
- 優化映像體積至極致（僅需合理最佳化）。
- 導入 CI/CD 自動構建流程。

## Acceptance Criteria
- 透過單一指令即可啟動前後端容器並完成問卷流程。
- 後端容器於啟動時自動遷移或初始化資料需求。
- 文件清楚列出建置步驟、環境變數與常見故障排除。
- 本地容器整合測試通過（問卷提交、儀表板登入與基本 CRUD）。

## Implementation Steps
1. 為前端撰寫 Dockerfile（含建置與服務階段），並驗證建置成功。
2. 為後端撰寫 Dockerfile，確保資料庫連線設定採環境變數。
3. 建立 docker-compose 設定檔，串接前後端與開發用資料庫。
4. 撰寫 README 區段說明容器啟動、環境變數與開發流程。
5. 執行端對端本地測試，紀錄結果與常見錯誤排除方式。

## Test/Validation
- 本地執行 `docker compose up` 並驗證前後端功能與資料流。
- 檢查映像啟動日誌無錯誤，並確認環境變數配置可自動載入。
- 透過自動化或手動腳本演練問卷提交與儀表板登入。

Git commit message: docker local stack
