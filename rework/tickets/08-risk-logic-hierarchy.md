## Summary
重寫後端風險評估邏輯，實作互斥分級（極高 > 非常高 > 高 > 中 > 低）並更新測試。

## Why
客戶要求以新事實欄位進行層級化判斷：依據 ASCVD、CAD 組合、糖尿病、CKD、血脂與代謝症候群等條件嚴謹分類。

## Scope
- 調整 `RiskAssessmentService`（或等效模組）以 rework.md 定義的條件順序計算風險等級，確保條件互斥且最高等級優先。
- 建立對應的事實標籤（例如 `has_CAD`, `has_DM`, `has_PAD`, `has_Carotid_Stenosis` 等）與代謝症候群計算。
- 更新風險報告中 `matchedRules`, `recommendations`, `riskFactors`, `metabolicSyndrome` 的內容，使其反映新邏輯。
- 擴充單元與整合測試覆蓋極高 / 非常高 / 高 / 中 / 低等關鍵案例。

## Out-of-Scope
- API schema 與 payload 變更（上一張票已處理）。
- 前端 UI 改動。

## Acceptance Criteria
- 給定 rework.md 描述的各種條件組合，服務能回傳正確且互斥的風險等級與對應風險因子。
- `matchedRules` 清楚描述觸發條件，`metabolicSyndrome` 結構與前端現有呈現相容。
- 所有新增與既有測試（後端）全數通過。

## Implementation Steps
1. 設計事實歸納函式：整理 payload 產出風險因子布林陣列（ASCVD、斑塊、CAD 子條件、糖尿病、CKD、血壓、血脂等）。
2. 實作互斥優先邏輯：依序判斷極高、非常高、高、中、低，第一次命中即回傳並記錄命中規則。
3. 產出新的 `riskFactors`, `matchedRules`, `recommendations` 與 `metabolicSyndrome` 結果。
4. 撰寫/更新單元測試（包含極高與代謝症候群案例）以及 API 整合測試。

## Test/Validation
- 執行 `pytest` 並確認新增案例全部通過。
- 手動呼叫 API（或使用現有測試腳本）檢查不同輸入的等級與報告內容。

Git commit message: implement hierarchical risk logic
