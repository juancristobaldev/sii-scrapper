from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from models.anomaly import AnomalyDetector
from models.fraud_classifier import FraudClassifier
from models.risk_scorer import RiskScorer
from detectors.patterns import PatternDetector
from detectors.collusion import CollusionDetector
from detectors.money_trail import MoneyTrailAnalyzer
import numpy as np

router = APIRouter()

anomaly_detector = AnomalyDetector()
fraud_classifier = FraudClassifier()
risk_scorer = RiskScorer()
pattern_detector = PatternDetector()
collusion_detector = CollusionDetector()
money_trail = MoneyTrailAnalyzer()

class TransactionRecord(BaseModel):
    id: str
    amount: float
    date: str
    source: str
    type: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class AnalysisRequest(BaseModel):
    transactions: List[TransactionRecord]
    historical_data: Optional[List[TransactionRecord]] = None
    company_config: Optional[Dict[str, Any]] = None

class AnomalyResult(BaseModel):
    transaction_id: str
    anomaly_score: float
    is_anomaly: bool
    reason: str
    severity: str

class FraudPattern(BaseModel):
    pattern_type: str
    description: str
    confidence: float
    involved_transactions: List[str]
    estimated_loss: float
    severity: str

class RiskAssessment(BaseModel):
    overall_score: float
    risk_level: str
    risk_factors: List[Dict[str, Any]]
    recommendations: List[str]

class AnalysisResponse(BaseModel):
    anomalies: List[AnomalyResult]
    fraud_patterns: List[FraudPattern]
    risk_assessment: RiskAssessment
    collusion_indicators: List[Dict[str, Any]]
    money_trail_issues: List[Dict[str, Any]]
    summary: str

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_transactions(request: AnalysisRequest):
    try:
        transactions_data = [t.model_dump() for t in request.transactions]
        historical_data = [t.model_dump() for t in request.historical_data] if request.historical_data else []

        if len(transactions_data) < 3:
            raise HTTPException(status_code=400, detail="Se necesitan al menos 3 transacciones para analizar")

        amounts = np.array([t["amount"] for t in transactions_data])
        available = [t for t in transactions_data if t["amount"] > 0]

        anomalies = anomaly_detector.detect(available) if len(available) >= 5 else []

        patterns = pattern_detector.detect(transactions_data)

        risk = risk_scorer.assess(transactions_data, patterns)

        collusion = collusion_detector.detect(transactions_data) if len(transactions_data) >= 5 else []

        trail_issues = money_trail.analyze(transactions_data, request.company_config or {})

        total_anomalies = len(anomalies)
        total_patterns = len(patterns)
        critical_count = sum(1 for a in anomalies if a["severity"] == "CRITICA")

        summary = (
            f"Analisis completado: {len(transactions_data)} transacciones procesadas. "
            f"Se detectaron {total_anomalies} anomalias, {total_patterns} patrones de fraude "
            f"y {critical_count} alertas criticas. "
            f"Score de riesgo general: {risk['overall_score']}/100."
        )

        return AnalysisResponse(
            anomalies=[AnomalyResult(**a) for a in anomalies],
            fraud_patterns=[FraudPattern(**p) for p in patterns],
            risk_assessment=RiskAssessment(**risk),
            collusion_indicators=collusion,
            money_trail_issues=trail_issues,
            summary=summary,
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en el motor de IA: {str(e)}")

@router.post("/detect-anomalies")
async def detect_anomalies(request: AnalysisRequest):
    try:
        transactions_data = [t.model_dump() for t in request.transactions]
        available = [t for t in transactions_data if t["amount"] > 0]
        results = anomaly_detector.detect(available)
        return {"anomalies": results, "total": len(results)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/classify-risk")
async def classify_risk(request: AnalysisRequest):
    try:
        transactions_data = [t.model_dump() for t in request.transactions]
        risk = risk_scorer.assess(transactions_data, [])
        return risk
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/detect-patterns")
async def detect_patterns(request: AnalysisRequest):
    try:
        transactions_data = [t.model_dump() for t in request.transactions]
        patterns = pattern_detector.detect(transactions_data)
        return {"patterns": patterns, "total": len(patterns)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    return {
        "status": "ok",
        "models_loaded": {
            "anomaly_detector": anomaly_detector is not None,
            "fraud_classifier": fraud_classifier is not None,
            "risk_scorer": risk_scorer is not None,
            "pattern_detector": pattern_detector is not None,
            "collusion_detector": collusion_detector is not None,
            "money_trail": money_trail is not None,
        }
    }
