# Podman 本地容器整合指南

本文件說明如何使用 Podman 啟動前端、後端與 PostgreSQL 服務，模擬未來在 Cloud Run 上的部署拓墣。

## 1. 前置準備

1. 安裝 Podman 4.x 以上版本，並確保 `podman compose` 可用。macOS 使用者可透過 [Podman Desktop](https://podman-desktop.io/) 安裝。
2. 於專案根目錄建立 `.podmanenv`（可由範例檔複製）：
   ```bash
   cp .env.podman.example .podmanenv
   ```
   視需求調整下列參數：
   - `DATABASE_URL`：後端 SQLAlchemy 連線字串。
   - `ADMIN_JWT_SECRET`：管理者登入使用的 JWT 金鑰。
   - `VITE_API_BASE_URL`：前端 build 時嵌入的 API 位置，預設指向 `http://backend:8000` 以透過 Nginx 反向代理。

## 2. 建立容器映像

Podman Compose 會自動讀取 `Dockerfile.frontend` 與 `backend/Dockerfile` 生成映像，無須手動建置。若仍希望先行建置，可執行：

```bash
podman build -t cj-frontend -f Dockerfile.frontend .
podman build -t cj-backend ./backend
```

## 3. 啟動整合環境

使用下列指令啟動所有服務（前端、後端、PostgreSQL）：

```bash
podman compose -f podman-compose.yml --env-file .podmanenv up --build
```

成功後可依序測試：

- 前端問卷：<http://localhost:5173>
- 後端 API：<http://localhost:8000/docs>
- 醫師儀表板：<http://localhost:8000/api/admin/dashboard>

若需背景執行，可加上 `-d` 參數。終止時使用：

```bash
podman compose -f podman-compose.yml down
```

若希望清除資料庫資料與映像，額外加上 `--volumes` 與 `--rmi all`。

## 4. 建立初始管理者

容器啟動後，進入後端容器建立管理者帳號：

```bash
podman compose -f podman-compose.yml exec backend python -m scripts.create_admin admin@example.com --password 'ChangeMe123!'
```

建立完成即可透過儀表板登入。

## 5. 執行測試

要在容器內執行後端測試：

```bash
podman compose -f podman-compose.yml exec backend pytest
```

前端測試仍建議於主機端使用 `npm test` 或 `npm run test`.

## 6. 常見問題

- **資料庫尚未啟動**：`backend` 服務會在 Alembic 遷移失敗時重試，亦可透過 `podman logs cj_db` 檢查 PostgreSQL。
- **無法登入儀表板**：確認 `.podmanenv` 使用與容器內的 `ADMIN_JWT_SECRET` 一致，並重新執行建立管理者指令。
- **API 404**：確保前端建置時 `VITE_API_BASE_URL` 指向 `http://backend:8000`，或於瀏覽器 Console 確認請求是否被 Nginx 攔截。

完成上述步驟即能以 Podman 模擬未來雲端部署的最小可行環境。
