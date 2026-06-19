import numpy as np
from typing import List, Dict, Any
from collections import Counter


class RiskScorer:
    def __init__(self):
        self.weights = {
            "CRITICA": 25,
            "ALTA": 10,
            "MEDIA": 4,
            "BAJA": 1,
        }

    def assess(self, transactions: List[Dict[str, Any]], patterns: List[Dict[str, Any]]) -> Dict[str, Any]:
        factors = []

        amount_factor = self._assess_amounts(transactions)
        factors.append(amount_factor)

        frequency_factor = self._assess_frequency(transactions)
        factors.append(frequency_factor)

        source_factor = self._assess_sources(transactions)
        factors.append(source_factor)

        manual_factor = self._assess_manual_interventions(transactions)
        factors.append(manual_factor)

        pattern_penalty = 0
        for p in patterns:
            severity = p.get("severity", "BAJA")
            pattern_penalty += self.weights.get(severity, 1)

        total_penalty = sum(f["penalty"] for f in factors) + pattern_penalty
        total_penalty = min(total_penalty, 100)

        score = max(0, 100 - total_penalty)

        if score >= 80:
            risk_level = "BAJO"
        elif score >= 50:
            risk_level = "MEDIO"
        elif score >= 25:
            risk_level = "ALTO"
        else:
            risk_level = "CRITICO"

        recommendations = self._generate_recommendations(factors, patterns, score)

        return {
            "overall_score": round(score, 1),
            "risk_level": risk_level,
            "risk_factors": factors,
            "recommendations": recommendations,
            "total_penalty": round(total_penalty, 1),
        }

    def _assess_amounts(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        amounts = [float(t["amount"]) for t in transactions if float(t["amount"]) > 0]
        if not amounts:
            return {"factor": "Montos", "penalty": 0, "detail": "Sin datos de montos"}

        mean = np.mean(amounts)
        std = np.std(amounts) if len(amounts) > 1 else 0

        outliers = sum(1 for a in amounts if abs(a - mean) > 2 * std) if std > 0 else 0
        ratio = outliers / len(amounts) if amounts else 0

        penalty = min(25, int(ratio * 50))

        return {
            "factor": "Volatilidad de Montos",
            "penalty": penalty,
            "detail": f"{outliers} de {len(amounts)} transacciones son outliers ({(ratio*100):.0f}%)",
            "mean": round(mean, 2),
            "std": round(std, 2),
        }

    def _assess_frequency(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        if len(transactions) < 2:
            return {"factor": "Frecuencia", "penalty": 0, "detail": "Datos insuficientes"}

        dates = []
        for t in transactions:
            try:
                from datetime import datetime
                d = datetime.fromisoformat(t.get("date", "").replace("Z", "+00:00"))
                dates.append(d.date())
            except:
                pass

        if not dates:
            return {"factor": "Frecuencia", "penalty": 5, "detail": "Fechas no parseables"}

        count_by_day = Counter(dates)
        if not count_by_day:
            return {"factor": "Frecuencia", "penalty": 0, "detail": "Distribucion normal"}

        max_day = max(count_by_day.values())
        avg_day = sum(count_by_day.values()) / max(len(count_by_day), 1)

        penalty = 0
        if max_day > avg_day * 3:
            penalty = 15

        return {
            "factor": "Frecuencia Anomala",
            "penalty": penalty,
            "detail": f"Max {max_day} transacciones/dia, promedio {avg_day:.1f}/dia",
        }

    def _assess_sources(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        sources = Counter(t.get("source", "desconocido") for t in transactions)
        unknown = sources.get("desconocido", 0) + sources.get("manual", 0)
        penalty = min(20, unknown * 2)
        return {
            "factor": "Origen de Datos",
            "penalty": penalty,
            "detail": f"{len(sources)} fuentes, {unknown} no trazables",
        }

    def _assess_manual_interventions(self, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        manual = sum(1 for t in transactions if "manual" in str(t.get("metadata", {})).lower()
                     or t.get("type") in ["ajuste", "correccion", "rebaja"])
        penalty = min(30, manual * 5)
        return {
            "factor": "Intervenciones Manuales",
            "penalty": penalty,
            "detail": f"{manual} ajustes manuales detectados",
        }

    def _generate_recommendations(self, factors: List[Dict], patterns: List[Dict], score: float) -> List[str]:
        recs = []

        for f in factors:
            if f["penalty"] >= 15:
                recs.append(f"Revisar {f['factor'].lower()}: {f['detail']}")

        for p in patterns[:3]:
            recs.append(f"Investigar {p['pattern_type']}: {p['description']}")

        if score < 50:
            recs.insert(0, "AUDITORIA URGENTE: Score de riesgo critico. Se recomienda intervencion inmediata.")
        elif score < 75:
            recs.insert(0, "ATENCION: Score de riesgo elevado. Programar auditoria detallada.")

        if not recs:
            recs.append("No se detectaron riesgos significativos. Continuar monitoreo regular.")

        return recs
