"""Pydantic models describing the risk assessment API contract."""

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, conint, confloat, validator


class GenderEnum(str, Enum):
    """Enumerates性別代碼，與前端欄位 `basicInfo.gender` 對齊。"""

    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class RiskLevelCodeEnum(str, Enum):
    """API 回傳層級代碼，需與前端 `LEVEL_DESCRIPTION` 使用的鍵一致。"""

    EXTREMELY_HIGH = "extremely_high"
    VERY_HIGH = "very_high"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    UNDEFINED = "undefined"


class MatchedRule(BaseModel):
    """代表被命中的風險規則。"""

    code: str = Field(..., min_length=1, description="規則識別碼，對齊前端 riskRules.js")
    label: str = Field(..., min_length=1, description="規則對應的顯示文字")

    class Config:
        anystr_strip_whitespace = True
        extra = "forbid"


class RiskFactorItem(BaseModel):
    """列出所有常見心血管危險因子，並標示是否被觸發。"""

    code: str = Field(..., min_length=1)
    label: str = Field(..., min_length=1)
    present: bool = Field(..., description="該危險因子是否成立")

    class Config:
        anystr_strip_whitespace = True
        extra = "forbid"


class MetabolicComponents(BaseModel):
    """代謝症候群五大構成條件的命中狀態。"""

    abdominalObesity: bool = False
    elevatedBloodPressure: bool = False
    elevatedGlucose: bool = False
    elevatedTriglyceride: bool = False
    lowHdl: bool = False

    class Config:
        extra = "forbid"


class MetabolicSyndromeResult(BaseModel):
    """描述代謝症候群的總命中數與構成細節。"""

    count: conint(ge=0, le=5) = Field(
        0,
        description="命中的代謝症候群構成項目數量，介於 0-5 之間",
    )
    components: MetabolicComponents = Field(
        default_factory=MetabolicComponents,
        description="各構成項目的布林狀態",
    )

    class Config:
        extra = "forbid"


class RiskAssessmentResponse(BaseModel):
    """後端回應格式，必須與前端 Step4_Report.jsx 的期望一致。"""

    level: str = Field(..., description="中文層級名稱，例如『極高』")
    levelCode: RiskLevelCodeEnum = Field(..., description="層級代碼，用於前端描述與樣式")
    matchedRules: List[MatchedRule] = Field(
        default_factory=list, description="命中的優先規則清單"
    )
    riskFactorCount: conint(ge=0) = Field(
        ..., description="此次評估命中的危險因子數"
    )
    riskFactors: List[RiskFactorItem] = Field(
        default_factory=list, description="各危險因子的詳盡狀態"
    )
    metabolicSyndrome: MetabolicSyndromeResult = Field(
        ..., description="代謝症候群命中概況"
    )
    recommendations: List[str] = Field(
        default_factory=list, description="依層級提供的建議行動"
    )
    evaluatedAt: str = Field(
        ..., description="ISO-8601 格式的評估時間字串"
    )

    class Config:
        anystr_strip_whitespace = True
        extra = "forbid"


class RiskAssessmentRequest(BaseModel):
    """對應前端 `buildRiskAssessmentPayload` 產生的請求格式。"""

    age: Optional[confloat(ge=0, le=130)] = Field(
        None, description="年齡，來源為前端填寫或出生年月計算，單位：歲"
    )
    gender: Optional[GenderEnum] = Field(
        None, description="性別代碼，允許 male / female / other"
    )
    is_male: bool = Field(..., description="是否為男性，供後端快速判斷門檻")
    has_hypertension: bool = Field(False, description="是否符合高血壓定義")
    family_history_early_chd: bool = Field(
        False, description="是否有早發性冠心病家族史"
    )
    hdl_c: Optional[confloat(ge=0, le=200)] = Field(
        None, description="HDL-C 數值，單位 mg/dL"
    )
    is_smoker: bool = Field(False, description="是否為吸菸者")
    metabolic_syndrome_factors: Optional[conint(ge=0, le=5)] = Field(
        None, description="代謝症候群命中數（若未提供後端會重新計算）"
    )
    has_diabetes: bool = Field(False, description="是否已診斷糖尿病")
    has_ckd: bool = Field(False, description="是否有慢性腎臟病或 eGFR < 60")
    ldl_c: Optional[confloat(ge=0, le=400)] = Field(
        None, description="LDL-C 數值，單位 mg/dL"
    )
    cac_score: Optional[conint(ge=0)] = Field(
        None, description="冠狀動脈鈣化分數 (CAC)"
    )
    has_ascvd_history: bool = Field(False, description="是否臨床確診 ASCVD")
    has_significant_plaque: bool = Field(
        False, description="是否有顯著血管斑塊狹窄"
    )
    has_cad: bool = Field(False, description="是否已診斷冠狀動脈疾病")
    mi_within_1_year: bool = Field(False, description="是否於一年內發生心肌梗塞")
    mi_history_count: conint(ge=0) = Field(
        0, description="累積心肌梗塞次數"
    )
    has_multivessel_obstruction: bool = Field(
        False, description="是否存在多支血管阻塞"
    )
    has_acs_with_diabetes: bool = Field(
        False, description="是否曾有急性冠心症合併糖尿病"
    )
    has_pad: bool = Field(False, description="是否有周邊動脈疾病 (PAD)")
    has_carotid_stenosis: bool = Field(
        False, description="是否有頸動脈狹窄"
    )
    has_stroke_with_atherosclerosis: bool = Field(
        False, description="是否有伴隨動脈硬化的缺血性中風 / TIA"
    )
    waist_cm: Optional[confloat(ge=0, le=200)] = Field(
        None, description="腰圍，單位公分"
    )
    systolic: Optional[confloat(ge=0, le=300)] = Field(
        None, description="收縮壓，單位 mmHg"
    )
    diastolic: Optional[confloat(ge=0, le=200)] = Field(
        None, description="舒張壓，單位 mmHg"
    )
    fasting_glucose: Optional[confloat(ge=0, le=1000)] = Field(
        None, description="空腹血糖，單位 mg/dL"
    )
    triglyceride: Optional[confloat(ge=0, le=2000)] = Field(
        None, description="三酸甘油酯，單位 mg/dL"
    )
    hypertension_medication: bool = Field(
        False, description="是否正在使用降血壓藥物"
    )
    diabetes_medication: bool = Field(
        False, description="是否正在使用降血糖藥物"
    )
    lipid_medication: bool = Field(
        False, description="是否正在使用調脂藥物"
    )
    egfr: Optional[confloat(ge=0, le=200)] = Field(
        None, description="估算腎絲球過濾率 eGFR，單位 mL/min/1.73m²"
    )

    @validator(
        "age",
        "hdl_c",
        "ldl_c",
        "cac_score",
        "mi_history_count",
        "metabolic_syndrome_factors",
        "waist_cm",
        "systolic",
        "diastolic",
        "fasting_glucose",
        "triglyceride",
        "egfr",
        pre=True,
        allow_reuse=True,
    )
    def empty_string_to_none(cls, value):
        """前端可能傳入空字串，轉換為 None 以通過型別檢驗。"""

        if value == "":
            return None
        return value

    @validator("gender", pre=True, allow_reuse=True)
    def normalize_gender(cls, value):
        """允許空字串或大小寫差異，並轉換為列舉值。"""

        if value is None or value == "":
            return None
        return str(value).lower()

    class Config:
        extra = "forbid"
        anystr_strip_whitespace = True

