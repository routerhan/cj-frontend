# 003 - 版面配置與響應式導覽

## Summary
- 建立桌機版的左側導覽 + 右側主內容版型，並於小螢幕切換為頂部步驟條的響應式體驗。

## why
- 清晰一致的版面讓使用者在多步驟流程中不迷惘，同時符合行動裝置優先的設計要求。

## Scope
- 在 `components/layout` 內實作 `Layout`, `Sidebar`, `MainContent`, `MobileStepper` 元件與對應 `.module.css`。
- `Layout` 負責串接 Sidebar、主內容，以及注入 Context 中的步驟資料。
- `Sidebar` 顯示全部步驟列表、完成狀態與目前步驟高亮，支援點擊已完成步驟回溯。
- `MobileStepper` 在寬度小於 768px 時顯示於主內容頂部，僅顯示進度資訊。
- 加入必要的 CSS Modules，確保 Sidebar 在桌機出現、行動裝置隱藏，並使用彈性盒模型排版。

## out of scope
- 不實作各步驟的表單內容。
- 不導入額外的第三方 UI 套件或動畫庫。

## Acceptance Criteria
- 在桌機寬度時顯示左側步驟列表與右側主內容；縮小視窗後 Sidebar 隱藏、MobileStepper 顯示。
- MobileStepper 顯示 `步驟 X / Y`，並與 Context 一致更新。
- Sidebar 可顯示步驟完成與目前所在步驟狀態（如勾勾、粗體或底色）。
- 點擊已完成步驟會呼叫 Context 的 `goToStep` 並更新主內容。
- 版面 CSS Modules 未出現全域樣式污染。

## Implementation Steps
- 建立 `Layout.jsx` 包含 Sidebar 與主內容插槽，從 Context 取得步驟與狀態。
- 實作 `Sidebar.jsx` 顯示步驟列表，並根據 `stepStatus` 決定圖示與 className。
- 實作 `MainContent.jsx` 接收 `children` 或 `currentStep`，負責渲染對應步驟頁面。
- 建立 `MobileStepper.jsx` 接收目前步驟與總步驟數，並於 CSS 中加上媒體查詢控制可視性。
- 撰寫基本互動測試（React Testing Library）或 Storybook 手動驗證 Sidebar 與 MobileStepper 的行為。

## test/Validation
- 在瀏覽器以開發模式檢視桌機與行動裝置版，確認 UI 切換正常並無 console error。
- 若有加入測試，執行 `npm run test` 確認通過；至少需有人工作業記錄畫面擷取或測試步驟。
