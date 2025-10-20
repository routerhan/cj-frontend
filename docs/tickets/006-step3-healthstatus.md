# 006 - Step3 健康狀況卡片與 eGFR 計算

## Summary
- 透過漸進式揭露卡片收集血壓、糖尿病、腎臟病與高脂血症資訊，並即時計算 eGFR。

## why
- Step3 為關鍵醫療資料，需提供清楚且動態的互動體驗，同時提供即時計算來協助使用者理解數值。

## Scope
- 建立 `components/ui/ProgressiveCard.jsx` 與 `.module.css`，提供展開/收合與過場動畫。
- 在 `steps/Step3_HealthStatus.jsx` 實作四張卡片，依使用者選擇 `[無] / [不知道] / [有]` 控制顯示子問題。
- 實作腎臟病卡片所需輸入欄位，並呼叫 `utils/calculations.js` 的 eGFR 計算函式。
- 在 `calculations.js` 新增 eGFR 相關函式與註解，並寫單元測試驗證。
- 使用 `InstantResult` 元件展示 eGFR 與中間值（例如 GFR、BSA）供使用者參考。
- 依輸入自動更新 Context，並在完成必要欄位後標記步驟為 `completed`。

## out of scope
- 不實作第三方圖表或進階動畫。
- 不處理醫療數據的更深入驗證或單位換算。

## Acceptance Criteria
- 四張 `ProgressiveCard` 預設為收合狀態，選擇 `[有]` 或特定 `[不知道]` 才展開子表單。
- eGFR 計算結果在所有必要欄位填寫完成後立即顯示，並可處理不同性別的常數。
- 子問題欄位為受控元件，返回 Step3 時可看到既有資料與展開狀態。
- 單元測試涵蓋 eGFR 計算公式，包含臨界值（Scr 小於/大於 kappa）的情境。
- CSS Modules 保證展開/收合動畫流暢，且在行動裝置上可垂直排列。

## Implementation Steps
- 開發 `ProgressiveCard` 組件（含展開狀態、切換按鈕、ARIA 屬性與動畫 class）。
- 在 Step3 建立每張卡片的主要問題與子問題欄位，根據選擇切換顯示。
- 實作 eGFR 函式與 BSA 調整，撰寫對應 `calculations.test.js` 的測試案例。
- 使用 `InstantResult` 顯示 eGFR 結果與提醒訊息（如值偏低時的建議文字）。
- 手動整合 Step3 與 Context 的 `stepStatus` 更新邏輯，確保完成判定正確。

## test/Validation
- 執行 `npm run test` 確保 eGFR 單元測試與任何新增測試皆通過。
- 在瀏覽器上手動輸入不同情境（無、不知道、有）確認卡片展開正常。
- 使用 Lighthouse 或 DevTools 檢查行動裝置視窗，確保佈局無溢位或操作困難。
