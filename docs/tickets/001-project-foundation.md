# 001 - 建立專案骨架與目錄結構

## Summary
- 使用 Vite 建立 React 18 行動優先骨架，並初始化約定的檔案佈局與開發腳本。

## why
- 先完成專案骨架能提供一致的開發框架，避免後續功能開發時還要處理環境或結構問題。

## Scope
- 建立全新的 Vite + React 專案並安裝必要依賴（含 CSS Modules 預設支援）。
- 在 `src` 底下建立 `components/layout`, `components/ui`, `steps`, `context`, `utils` 等目錄。
- 為主要檔案（`App.jsx`, `main.jsx`, `FormContext.jsx` 等）建立最小可編譯的樣板內容與匯出。
- 建立對應的 `.module.css` 檔案（可為占位符），確保樣式載入流程正常。
- 確保專案腳本（`dev`, `build`, `preview`）於 `package.json` 中正確設定。

## out of scope
- 不實作任何實際的頁面邏輯、表單流程或計算功能。
- 不撰寫細緻的樣式設計；僅建立必要的占位內容。

## Acceptance Criteria
- 在乾淨環境下 `npm install` 後可成功執行 `npm run dev`。
- 檔案目錄結構符合規劃，所有主要檔案存在且可被匯入。
- 專案以 CSS Modules 為預設樣式策略，沒有殘留單一大型 `style.css` 或 inline style。

## Implementation Steps
- 使用 `npm create vite@latest` 初始化 React 專案，確認以 JavaScript + SWC 或 JavaScript 為基礎。
- 進入專案後執行 `npm install` 安裝依賴。
- 建立規劃中的資料夾與空白檔案（含 `.module.css`），在檔案內放入最小化樣板內容與預設匯出。
- 更新 `App.jsx` 與 `main.jsx` 支援 Context Provider 的占位符，確保建置不報錯。
- 將 README 或 `plan.md` 中的重要執行指令記錄至 `package.json` 的 `scripts` 或專案文件（如有需要）。

## test/Validation
- 執行 `npm run dev` 確認開發伺服器可啟動且瀏覽器無錯誤。
- 執行 `npm run build` 確認專案可成功打包，驗證檔案結構與匯出正確。
