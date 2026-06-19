from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import numpy as np
from typing import List, Dict, Any
from datetime import datetime


class AnomalyDetector:
    def __init__(self):
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,
            random_state=42,
            n_jobs=-1
        )
        self.scaler = StandardScaler()
        self.fitted = False

    def _extract_features(self, transactions: List[Dict[str, Any]]) -> np.ndarray:
        features = []
        now = datetime.now()

        for t in transactions:
            amount = float(t.get("amount", 0))

            try:
                date = datetime.fromisoformat(t.get("date", "").replace("Z", "+00:00"))
                days_ago = (now - date.replace(tzinfo=None)).days
                day_of_week = date.weekday()
                hour = date.hour
            except:
                days_ago = 0
                day_of_week = 0
                hour = 0

            source_hash = hash(t.get("source", "")) % 100
            type_hash = hash(t.get("type", "")) % 100

            features.append([amount, days_ago, day_of_week, hour, source_hash, type_hash])

        return np.array(features)

    def detect(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if len(transactions) < 3:
            return []

        features = self._extract_features(transactions)
        features_scaled = self.scaler.fit_transform(features)
        predictions = self.model.fit_predict(features_scaled)
        scores = self.model.score_samples(features_scaled)

        score_min = scores.min()
        score_max = scores.max()
        score_range = score_max - score_min if score_max > score_min else 1

        results = []
        for i, (pred, score) in enumerate(zip(predictions, scores)):
            normalized_score = (score - score_min) / score_range
            normalized_score = 1.0 - normalized_score

            if pred == -1:
                amount = float(transactions[i].get("amount", 0))
                severity = "CRITICA" if normalized_score > 0.8 else "ALTA" if normalized_score > 0.6 else "MEDIA"

                results.append({
                    "transaction_id": transactions[i].get("id", f"tx-{i}"),
                    "anomaly_score": round(normalized_score * 100, 1),
                    "is_anomaly": True,
                    "reason": self._generate_reason(transactions[i], normalized_score, features[i]),
                    "severity": severity,
                    "amount": amount,
                })

        return sorted(results, key=lambda x: x["anomaly_score"], reverse=True)

    def _generate_reason(self, transaction: Dict[str, Any], score: float, features: np.ndarray) -> str:
        amount = float(transaction.get("amount", 0))
        source = transaction.get("source", "")
        ttype = transaction.get("type", "")

        reasons = []

        if amount > 10000000:
            reasons.append("monto inusualmente alto")
        elif amount < 100 and amount > 0:
            reasons.append("monto inusualmente bajo")

        if score > 0.8:
            reasons.append("patron altamente anomalo detectado por Isolation Forest")
        elif score > 0.5:
            reasons.append("desviacion significativa del comportamiento normal")

        if "manual" in str(transaction.get("metadata", {})).lower():
            reasons.append("ajuste manual detectado")

        return ", ".join(reasons) if reasons else "comportamiento estadisticamente anomalo"
