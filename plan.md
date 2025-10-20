### **PRP (Prompt Requirement Plan) 開始**

**專案標題：** 互動式健康風險評估網頁應用程式

**AI 助手角色：**
您是一位資深的 React 前端工程師，精通使用 Vite 建立高效能、響應式 (Mobile-First) 的網頁應用程式。您擅長將複雜的表單流程轉化為簡潔、直觀且使用者友善的互動介面，並專注於使用 React Hooks 和 Context API 進行狀態管理。

**1. 專案概述 (Project Overview)**

我們的目標是建立一個心血管疾病 (CVD) 風險評估工具。使用者將透過一個多步驟的表單填寫他們的健康資料。本應用程式的核心是\*\*「無痛的填寫體驗」\*\*：

  * **化整為零：** 將冗長的表單拆分成多個邏輯步驟。
  * **即時反饋：** 在使用者輸入後立即計算並顯示相關指標 (如 BMI, 年齡, eGFR)。
  * **漸進式揭露：** 根據使用者的回答動態顯示或隱藏相關的子問題。
  * **最終產出：** 基於使用者的輸入，顯示一個專業的風險評估報告頁面。

**2. 技術棧與規範 (Technical Stack & Specs)**

  * **框架 (Framework):** React 18+ (請使用 Function Components 和 Hooks)
  * **建置工具 (Build Tool):** Vite
  * **狀態管理 (State Management):**
      * 請使用 React Context API (`createContext`, `useContext`) 建立一個 `FormContext`。
      * 這個 Context 應儲存所有步驟的表單資料 (`formData`)、當前所在的步驟 (`currentStep`)，以及每個步驟的完成狀態 (`stepStatus`)。
  * **樣式 (Styling):**
      * 請使用 **CSS Modules** (`.module.css`) 進行元件範圍化的樣式管理。
      * **嚴格禁止**使用 inline-style 或單一的巨大 `style.css` 檔案。
  * **路由 (Routing):** 由於這是一個單頁的嚮導 (Wizard) 流程，**不需要**使用 `react-router`。請使用 `FormContext` 中的 `currentStep` 狀態來條件式渲染 (Conditional Rendering) 不同的步驟頁面。

**3. 設計與佈局 (Design & Layout)**

  * **整體風格：** 簡潔明亮 (Clean & Bright)。使用大量留白、清晰的字體，並搭配專業、令人安心的色調（如柔和的藍色、綠色）。
  * **佈局 (Desktop)：**
      * 採用「左側邊欄 + 右側主內容」的兩欄式佈局。
      * **左側邊欄 (`<Sidebar />`)：**
          * **功能：** 導航與狀態顯示。
          * **內容：** 垂直顯示所有步驟的列表（例如："1. 基本資料", "2. 生活習慣", "3. 健康狀況", "4. 風險報告"）。
          * **動態響應：**
              * **即時更新：** 當使用者完成一個步驟（例如填完所有必填項）並點擊「下一步」時，`stepStatus` 應更新，Sidebar 中對應的步驟旁邊應顯示一個「已完成」的圖示（例如 `✓`）。
              * **當前步驟：** 高亮顯示使用者當前所在的步驟。
              * **回溯查看：** 允許使用者點擊**已完成**的步驟，返回查看或修改資料。
      * **右側主內容 (`<MainContent />`)：**
          * **功能：** 顯示當前步驟的表單內容或結果頁面。
  * **響應式設計 (Mobile-First)：**
      * **這是核心要求。** 網頁必須在手機上易於填寫。
      * 在小螢幕上（例如 `max-width: 768px`），左側邊欄應**自動隱藏**。
      * 取而代之，在主內容區域的**頂部**顯示一個水平的「步驟條」(Stepper) 元件，僅顯示當前進度（例如 `步驟 1 / 4`），以節省空間。

**4. 核心功能與使用者流程 (Core Features & User Flow)**

請依序實作以下頁面/步驟，所有資料都應儲存在 `FormContext` 中。

  * **Step 0: 歡迎頁 (`<WelcomeStep />`)**

      * 標題：「10 分鐘，預測您未來 10 年的心血管風險。」
      * 一個 [立即開始評估] 按鈕，點擊後將 `currentStep` 設為 1。

  * **Step 1: 基本資料 (`<Step1_BasicInfo />`)**

      * 表單欄位：`性別`, `出生年月日`, `國藉`, `身高 (cm)`, `體重 (kg)`, `腰圍 (cm)`。
      * **即時計算 (1)：** 當 `出生年月日` 填寫完畢，立即在旁邊計算並顯示 `年齡`。
      * **即時計算 (2)：** 當 `身高` 和 `體重` 填寫完畢，立即在旁邊計算並顯示 `BMI` 數值，並給予文字反饋（例如：「標準」、「過重」）。
      * *BMI 公式：* `體重(kg) / (身高(m) * 身高(m))`

  * **Step 2: 生活習慣與家族史 (`<Step2_Lifestyle />`)**

      * 表單欄位：`抽煙`, `家族史`, `過去有無發生過心血管疾病`。
      * 使用 `(i)` 圖示為「家族史」提供 tooltip 解釋：「（父小於55歲或母小於65歲發生心肌梗塞或冠心病）」。

  * **Step 3: 健康狀況 (`<Step3_HealthStatus />`)**

      * **此為最關鍵的頁面。** 請使用「漸進式揭露」設計。
      * **結構：** 畫面應由 4 個可收合的卡片 (`<ProgressiveCard />`) 組成：`高血壓`, `糖尿病`, `腎臟病`, `高脂血症`。
      * **互動邏S輯：**
        1.  每張卡片預設只顯示一個問題（例如：「您是否有高血壓？」）和選項 `[ 無 ] [ 不知道 ] [ 有 ]`。
        2.  **只有當**使用者點擊 `[ 有 ]` (或在某些情況下 `[ 不知道 ]`) 時，卡片才流暢地展開 (slide down)，顯示對應的子問題（例如：「目前有無服藥」、「最近一次血壓值」）。
        3.  如果使用者選擇 `[ 無 ]`，則卡片保持收合。
      * **即時計算 (3)：**
          * 在「腎臟病」卡片中，當使用者輸入 `肌酸酐數值`、`性別`、`年齡`、`身高`、`體重` 都可用時，立即計算並顯示 `eGFR`。
          * *eGFR 公式 (請在 `utils/calculations.js` 中實作)：*
              * `kappa = (性別 === '女') ? 0.7 : 0.9`
              * `alpha = (性別 === '女') ? -0.241 : -0.302`
              * `SexFactor = (性別 === '女') ? 1.012 : 1`
              * `scr_kappa_ratio = Serum Creatinine / kappa`
              * `GFR = 142 * Math.min(scr_kappa_ratio, 1)**alpha * Math.max(scr_kappa_ratio, 1)**-1.2 * 0.9938**Age * SexFactor`
              * `BSA = 0.007184 * Height**0.725 * Weight**0.425`
              * `eGFR_BSA_Adjusted = GFR * BSA / 1.73` (這才是最終顯示的 eGFR)

  * **Step 4: 風險報告 (`<Step4_Report />`)**

      * 顯示一個簡短的載入動畫（模擬計算中）。
      * **後端 API 模擬：**
          * 目前我們沒有後端。請建立一個 `utils/mockApi.js` 檔案。
          * 建立一個 `calculateRisk(formData)` 函式，它接收 `FormContext` 中的所有資料。
          * 此函式應 `await` 一個 `setTimeout` (模擬 1.5 秒的網路延遲)。
          * 函式**模擬**計算一個風險百分比（例如：`Math.random() * 20 + 5`）和風險等級（「低」、「中」、「高」）。
      * **頁面顯示：**
        1.  顯示核心風險數字（例如 `12.5%`）和風險等級（例如 `中度風險`）。
        2.  顯示一個簡易的視覺化圖表（例如：您的風險 vs. 同齡健康者風險）。
        3.  列出使用者填寫的「主要風險因子」（例如：血壓偏高、LDL 過高）。
        4.  提供行動建議 (CTA) 和 [下載 PDF 報告] 按鈕（按鈕目前不需功能）。

**5. 元件拆分建議 (Component Breakdown)**

請依據此結構生成程式碼：

```
/src
  /components
    /layout
      Layout.jsx
      Sidebar.jsx
      MainContent.jsx
      MobileStepper.jsx
    /ui
      ProgressiveCard.jsx   (用於 Step 3 的卡片)
      InstantResult.jsx   (用於顯示 BMI, eGFR 等)
      Tooltip.jsx         (用於 (i) 圖示)
      Button.jsx
      LoadingSpinner.jsx
  /pages (或 /steps)
    Welcome.jsx
    Step1_BasicInfo.jsx
    Step2_Lifestyle.jsx
    Step3_HealthStatus.jsx
    Step4_Report.jsx
  /context
    FormContext.jsx         (管理所有狀態和步驟邏輯)
  /utils
    calculations.js       (放置 BMI 和 eGFR 的純函式)
    mockApi.js            (放置模擬的 calculateRisk 函式)
  App.jsx                 (主元件，包含 Layout 和 Context Provider)
  main.jsx
```

**6. 輸出要求 (Output Requirements)**

  * 請提供一個完整的、可運行的 Vite + React 專案結構。
  * 為上述 `src` 目錄下的**所有檔案**提供完整的程式碼。
  * 為每個元件提供對應的 `.module.css` 檔案，確保實現了「簡潔明亮」且「響應式」的設計。
  * 在程式碼中添加關鍵註解，特別是在 `FormContext.jsx`（解釋 state 結構）和 `calculations.js`（解釋公式實作）中。

### **PRP (Prompt Requirement Plan) 結束**