"""風險評估服務層介面與實際心血管風險判定邏輯。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Callable, Dict, Iterable, List, Optional, Protocol

from fastapi import Depends
from sqlalchemy.orm import Session

from app.db.session import get_session
from app.repositories import AssessmentRepository
from app.schemas import (
    MetabolicSyndromeResult,
    RiskAssessmentRequest,
    RiskAssessmentResponse,
    RiskLevelCodeEnum,
    RiskFactorItem,
    MatchedRule,
)


class RiskAssessmentServiceProtocol(Protocol):
    """定義風險評估服務所需實作的介面，供路由層依賴注入。"""

    def evaluate(self, payload: RiskAssessmentRequest) -> RiskAssessmentResponse:
        """依據輸入資料回傳風險評估結果。"""


def _title_by_code(code: RiskLevelCodeEnum) -> str:
    """回傳與層級代碼對應的中文標籤。"""

    mapping: Dict[RiskLevelCodeEnum, str] = {
        RiskLevelCodeEnum.EXTREMELY_HIGH: "極高",
        RiskLevelCodeEnum.VERY_HIGH: "非常高",
        RiskLevelCodeEnum.HIGH: "高",
        RiskLevelCodeEnum.MEDIUM: "中",
        RiskLevelCodeEnum.LOW: "低",
        RiskLevelCodeEnum.UNDEFINED: "未定義",
    }
    return mapping[code]


def _to_float(value) -> float | None:
    """確保輸入為 float 或 None。"""

    if value is None:
        return None
    return float(value)


def _to_int(value) -> int | None:
    """確保輸入為 int 或 None。"""

    if value is None:
        return None
    return int(value)


class Rule:
    """封裝風險規則，提供一致的匹配介面。"""

    def __init__(self, code: str, label: str, predicate: Callable[[RiskAssessmentRequest], bool]):
        self.code = code
        self.label = label
        self.predicate = predicate

    def matches(self, payload: RiskAssessmentRequest) -> bool:
        return bool(self.predicate(payload))

    def to_match(self) -> MatchedRule:
        return MatchedRule(code=self.code, label=self.label)


EXTREME_RULES: List[Rule] = [
    Rule(
        "cad_recent_mi",
        "冠狀動脈疾病且過去一年曾發生心肌梗塞",
        lambda p: p.has_cad and p.mi_within_1_year,
    ),
    Rule(
        "cad_multiple_mi",
        "冠狀動脈疾病且累積兩次以上心肌梗塞",
        lambda p: p.has_cad and (_to_int(p.mi_history_count) or 0) >= 2,
    ),
    Rule(
        "cad_multivessel",
        "冠狀動脈疾病且存在多支血管阻塞",
        lambda p: p.has_cad and p.has_multivessel_obstruction,
    ),
    Rule(
        "cad_with_diabetes",
        "冠狀動脈疾病且急性冠心症合併糖尿病",
        lambda p: p.has_cad and p.has_acute_coronary_syndrome and p.has_diabetes,
    ),
    Rule(
        "cad_with_pad",
        "冠狀動脈疾病且合併周邊動脈疾病",
        lambda p: p.has_cad and p.has_pad,
    ),
    Rule(
        "cad_with_carotid",
        "冠狀動脈疾病且合併頸動脈狹窄",
        lambda p: p.has_cad and p.has_carotid_stenosis,
    ),
    Rule(
        "pad_with_carotid",
        "周邊動脈疾病且合併頸動脈狹窄",
        lambda p: p.has_pad and p.has_carotid_stenosis,
    ),
]


VERY_HIGH_RULES: List[Rule] = [
    Rule(
        "ascvd_history",
        "臨床確診動脈硬化心血管疾病 (ASCVD)",
        lambda p: bool(
            p.has_ascvd_history
            or p.has_acute_coronary_syndrome_history
            or p.has_revascularization_history
            or p.has_ischemic_stroke_with_atherosclerosis
            or p.has_peripheral_arterial_disease_history
            or p.has_pad
        ),
    ),
    Rule(
        "significant_plaque",
        "影像顯示顯著斑塊狹窄（≥50%）",
        lambda p: bool(
            p.has_significant_plaque
            or p.has_coronary_angiography_stenosis
            or p.has_coronary_ct_stenosis
            or p.has_vascular_ultrasound_stenosis
        ),
    ),
]


HIGH_RULES: List[Rule] = [
    Rule("diabetes", "已診斷糖尿病", lambda p: bool(p.has_diabetes)),
    Rule("ckd", "慢性腎臟病 (含 eGFR < 60 或 UACR ≥ 30)", lambda p: bool(p.has_ckd)),
    Rule(
        "ldl_190",
        "低密度脂蛋白膽固醇 (LDL-C) ≥ 190 mg/dL",
        lambda p: (ldl := _to_float(p.ldl_c)) is not None and ldl >= 190,
    ),
    Rule(
        "cac_400",
        "冠狀動脈鈣化分數 (CAC) ≥ 400",
        lambda p: bool(p.cac_ge_400),
    ),
]


def _compute_metabolic_components(payload: RiskAssessmentRequest) -> MetabolicSyndromeResult:
    """依照前端規則計算代謝症候群構成與命中數。"""

    is_male = payload.is_male
    waist = _to_float(payload.waist_cm)
    systolic = _to_float(payload.systolic)
    diastolic = _to_float(payload.diastolic)
    fasting_glucose = _to_float(payload.fasting_glucose)
    triglyceride = _to_float(payload.triglyceride)
    hdl = _to_float(payload.hdl_c)

    abdominal_obesity = waist is not None and (waist >= 90 if is_male else waist >= 80)
    elevated_bp = (
        (systolic is not None and systolic >= 130)
        or (diastolic is not None and diastolic >= 85)
        or payload.hypertension_medication
    )
    elevated_glucose = (
        (fasting_glucose is not None and fasting_glucose >= 100)
        or payload.diabetes_medication
    )
    elevated_triglyceride = (
        (triglyceride is not None and triglyceride >= 150)
        or payload.lipid_medication
    )
    low_hdl = hdl is not None and (hdl < 40 if is_male else hdl < 50)

    components = {
        "abdominalObesity": abdominal_obesity,
        "elevatedBloodPressure": elevated_bp,
        "elevatedGlucose": elevated_glucose,
        "elevatedTriglyceride": elevated_triglyceride,
        "lowHdl": low_hdl,
    }
    count = sum(1 for present in components.values() if present)
    return MetabolicSyndromeResult(count=count, components=components)


class RiskFactorDefinition:
    """封裝危險因子判斷邏輯。"""

    def __init__(self, code: str, label: str, predicate: Callable[[RiskAssessmentRequest], bool]):
        self.code = code
        self.label = label
        self.predicate = predicate

    def build_item(self, payload: RiskAssessmentRequest) -> RiskFactorItem:
        return RiskFactorItem(code=self.code, label=self.label, present=self.predicate(payload))


def _risk_factor_definitions(
    metabolic_result: MetabolicSyndromeResult,
) -> Iterable[RiskFactorDefinition]:
    """建立所有危險因子定義，供後續轉換成回傳資料。"""

    return [
        RiskFactorDefinition("hypertension", "高血壓", lambda p: bool(p.has_hypertension)),
        RiskFactorDefinition(
            "age",
            "年齡達風險閾值",
            lambda p: (age := _to_float(p.age)) is not None
            and age >= (45 if p.is_male else 55),
        ),
        RiskFactorDefinition(
            "family_history",
            "早發性冠心病家族史",
            lambda p: bool(p.family_history_early_chd),
        ),
        RiskFactorDefinition(
            "low_hdl",
            "HDL-C 偏低",
            lambda p: (hdl := _to_float(p.hdl_c)) is not None
            and (hdl < 40 if p.is_male else hdl < 50),
        ),
        RiskFactorDefinition("smoking", "抽菸", lambda p: bool(p.is_smoker)),
        RiskFactorDefinition(
            "metabolic_syndrome",
            "代謝症候群 (≥3 項構成條件)",
            lambda _: metabolic_result.count >= 3,
        ),
    ]


RECOMMENDATIONS: Dict[RiskLevelCodeEnum, List[str]] = {
    RiskLevelCodeEnum.EXTREMELY_HIGH: [
        "儘速與心血管專科醫師討論侵入性治療與藥物調整策略",
        "確認雙重抗血小板及強效降脂治療是否到位",
        "規劃密集的生活型態與危險因子管理，並安排密集追蹤",
    ],
    RiskLevelCodeEnum.VERY_HIGH: [
        "與主治醫師檢視 ASCVD 的二級預防用藥與檢查計畫",
        "評估是否需要進一步影像檢查或血管功能測試",
        "維持每 3-6 個月一次的多危險因子監測 (血壓 / 血脂 / 血糖)",
    ],
    RiskLevelCodeEnum.HIGH: [
        "設定血脂與血糖控制目標，必要時調整藥物劑量或種類",
        "強化生活型態介入：飲食、運動、體重管理",
        "每 6 個月追蹤腎功能、血脂與代謝指標",
    ],
    RiskLevelCodeEnum.MEDIUM: [
        "持續規律運動與均衡飲食，關注腰圍與體重變化",
        "每年檢查血壓、血脂、血糖，必要時諮詢專業醫療建議",
    ],
    RiskLevelCodeEnum.LOW: [
        "維持健康生活型態，避免菸酒與過度飲食",
        "每 1-2 年追蹤血壓與基本血液檢查以確保穩定",
    ],
    RiskLevelCodeEnum.UNDEFINED: [
        "資料不足以評估，請補充必要檢測或臨床資訊後再試",
    ],
}


def _evaluate_rules(rules: Iterable[Rule], payload: RiskAssessmentRequest) -> List[MatchedRule]:
    """回傳所有命中的規則。"""

    return [rule.to_match() for rule in rules if rule.matches(payload)]


class RiskAssessmentService(RiskAssessmentServiceProtocol):
    """根據 `riskRules.js` 重新實作的風險評估服務。"""

    def __init__(self, repository: Optional[AssessmentRepository] = None):
        self.repository = repository

    def evaluate(self, payload: RiskAssessmentRequest) -> RiskAssessmentResponse:
        metabolic_result = _compute_metabolic_components(payload)

        risk_factors = [
            definition.build_item(payload)
            for definition in _risk_factor_definitions(metabolic_result)
        ]
        risk_factor_count = sum(1 for factor in risk_factors if factor.present)

        extreme_matches = _evaluate_rules(EXTREME_RULES, payload)
        if extreme_matches:
            level_code = RiskLevelCodeEnum.EXTREMELY_HIGH
            response = self._build_response(
                level_code, risk_factor_count, risk_factors, metabolic_result, extreme_matches
            )
            return self._finalize_response(payload, response)

        very_high_matches = _evaluate_rules(VERY_HIGH_RULES, payload)
        if very_high_matches:
            level_code = RiskLevelCodeEnum.VERY_HIGH
            response = self._build_response(
                level_code, risk_factor_count, risk_factors, metabolic_result, very_high_matches
            )
            return self._finalize_response(payload, response)

        high_matches = _evaluate_rules(HIGH_RULES, payload)
        if high_matches:
            level_code = RiskLevelCodeEnum.HIGH
            response = self._build_response(
                level_code, risk_factor_count, risk_factors, metabolic_result, high_matches
            )
            return self._finalize_response(payload, response)

        if risk_factor_count >= 2:
            level_code = RiskLevelCodeEnum.MEDIUM
            matches = [MatchedRule(code="risk_factor_count", label="心血管危險因子達兩項以上")]
            response = self._build_response(
                level_code, risk_factor_count, risk_factors, metabolic_result, matches
            )
            return self._finalize_response(payload, response)

        if risk_factor_count == 1:
            level_code = RiskLevelCodeEnum.LOW
            matches = [MatchedRule(code="single_risk_factor", label="心血管危險因子 1 項")]
            response = self._build_response(
                level_code, risk_factor_count, risk_factors, metabolic_result, matches
            )
            return self._finalize_response(payload, response)

        level_code = RiskLevelCodeEnum.UNDEFINED
        response = self._build_response(
            level_code, risk_factor_count, risk_factors, metabolic_result, []
        )
        return self._finalize_response(payload, response)

    def _build_response(
        self,
        level_code: RiskLevelCodeEnum,
        risk_factor_count: int,
        risk_factors: List[RiskFactorItem],
        metabolic_result: MetabolicSyndromeResult,
        matched_rules: List[MatchedRule],
    ) -> RiskAssessmentResponse:
        """依指定層級組裝回應物件。"""

        return RiskAssessmentResponse(
            level=_title_by_code(level_code),
            levelCode=level_code,
            matchedRules=matched_rules,
            riskFactorCount=risk_factor_count,
            riskFactors=risk_factors,
            metabolicSyndrome=metabolic_result,
            recommendations=RECOMMENDATIONS[level_code],
            evaluatedAt=datetime.now(timezone.utc).isoformat(),
        )

    def _finalize_response(
        self,
        payload: RiskAssessmentRequest,
        response: RiskAssessmentResponse,
    ) -> RiskAssessmentResponse:
        """在回傳之前將結果持久化。"""

        if self.repository is not None:
            self.repository.create_assessment(payload, response)
        return response


def get_risk_assessment_service(
    session: Session = Depends(get_session),
) -> RiskAssessmentServiceProtocol:
    """FastAPI 依賴注入入口，回傳實際的風險評估服務。"""

    repository = AssessmentRepository(session)
    return RiskAssessmentService(repository=repository)
