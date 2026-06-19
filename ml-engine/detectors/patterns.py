from typing import List, Dict, Any
from collections import Counter, defaultdict
from datetime import datetime, timedelta


class PatternDetector:
    def detect(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        patterns = []

        overpricing = self._detect_overpricing(transactions)
        patterns.extend(overpricing)

        split_payments = self._detect_split_payments(transactions)
        patterns.extend(split_payments)

        off_hours = self._detect_off_hours(transactions)
        patterns.extend(off_hours)

        rapid_modifications = self._detect_rapid_modifications(transactions)
        patterns.extend(rapid_modifications)

        manual_rebates = self._detect_manual_rebates(transactions)
        patterns.extend(manual_rebates)

        return patterns

    def _detect_overpricing(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        by_type = defaultdict(list)

        for t in transactions:
            ttype = t.get("type", "desconocido")
            by_type[ttype].append(float(t["amount"]))

        for ttype, amounts in by_type.items():
            if len(amounts) < 3:
                continue
            mean = sum(amounts) / len(amounts)
            overpriced = [a for a in amounts if a > mean * 3]
            if overpriced:
                results.append({
                    "pattern_type": "SOBREPRECIOS",
                    "description": f"{len(overpriced)} sobreprecios detectados en {ttype} (>300% promedio)",
                    "confidence": 0.75,
                    "amount": sum(overpriced),
                    "estimated_loss": sum(overpriced) - (mean * len(overpriced)),
                    "severity": "ALTA",
                    "involved_transactions": [],
                })

        return results

    def _detect_split_payments(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        sorted_tx = sorted(transactions, key=lambda t: t.get("date", ""))

        for i in range(len(sorted_tx) - 1):
            try:
                d1 = datetime.fromisoformat(sorted_tx[i]["date"].replace("Z", "+00:00"))
                d2 = datetime.fromisoformat(sorted_tx[i + 1]["date"].replace("Z", "+00:00"))
                diff = abs((d2 - d1).total_seconds())

                if diff < 3600:
                    a1 = float(sorted_tx[i]["amount"])
                    a2 = float(sorted_tx[i + 1]["amount"])
                    if 0.9 <= a1 / (a2 or 1) <= 1.1:
                        results.append({
                            "pattern_type": "PAGOS_FRACCIONADOS",
                            "description": f"Pagos fraccionados detectados: {a1:,.0f} + {a2:,.0f} en menos de 1 hora",
                            "confidence": 0.8,
                            "amount": a1 + a2,
                            "estimated_loss": 0,
                            "severity": "MEDIA",
                            "involved_transactions": [sorted_tx[i]["id"], sorted_tx[i + 1]["id"]],
                        })
            except:
                pass

        return results

    def _detect_off_hours(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        off_hours = []
        for t in transactions:
            try:
                d = datetime.fromisoformat(t.get("date", "").replace("Z", "+00:00"))
                hour = d.hour
                if hour < 6 or hour > 22:
                    off_hours.append(t)
            except:
                pass

        if off_hours:
            total = sum(float(t["amount"]) for t in off_hours)
            return [{
                "pattern_type": "MOVIMIENTOS_FUERA_HORARIO",
                "description": f"{len(off_hours)} movimientos en horario inusual (22:00-06:00) por {total:,.0f}",
                "confidence": 0.65,
                "amount": total,
                "estimated_loss": 0,
                "severity": "MEDIA",
                "involved_transactions": [t["id"] for t in off_hours[:10]],
            }]
        return []

    def _detect_rapid_modifications(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        modifications = [t for t in transactions if t.get("type") in ["modificacion", "ajuste", "correccion"]]
        if len(modifications) >= 3:
            total = sum(float(t["amount"]) for t in modifications)
            return [{
                "pattern_type": "MODIFICACIONES_MASIVAS",
                "description": f"{len(modifications)} modificaciones/ajustes detectados por {total:,.0f}",
                "confidence": 0.7,
                "amount": total,
                "estimated_loss": total * 0.3,
                "severity": "ALTA",
                "involved_transactions": [t["id"] for t in modifications],
            }]
        return []

    def _detect_manual_rebates(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        rebates = [t for t in transactions if t.get("type") in ["rebaja", "descuento", "nota_credito"]
                   and "manual" in str(t.get("metadata", {})).lower()]
        if rebates:
            total = sum(float(t["amount"]) for t in rebates)
            return [{
                "pattern_type": "REBAJAS_MANUALES_SOSPECHOSAS",
                "description": f"{len(rebates)} rebajas manuales sin justificar por {total:,.0f}",
                "confidence": 0.85,
                "amount": total,
                "estimated_loss": total,
                "severity": "CRITICA",
                "involved_transactions": [t["id"] for t in rebates],
            }]
        return []
