import numpy as np
from typing import List, Dict, Any
from collections import Counter


class FraudClassifier:
    def __init__(self):
        self.thresholds = {
            "DUPLICIDAD_PAGOS": {"max_hours": 24, "amount_tolerance": 0.01},
            "TRANSFERENCIAS_SOSPECHOSAS": {"round_amount": True, "min_amount": 100000},
            "FRAUDE_TRIBUTARIO": {"iva_threshold": 0.05},
            "PAGOS_FANTASMA": {"no_receipt_days": 30},
        }

    def classify(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        patterns = []

        duplicates = self.detect_duplicates(transactions)
        patterns.extend(duplicates)

        suspicious_transfers = self.detect_suspicious_transfers(transactions)
        patterns.extend(suspicious_transfers)

        ghost_payments = self.detect_ghost_payments(transactions)
        patterns.extend(ghost_payments)

        return patterns

    def detect_duplicates(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        by_amount = {}

        for t in transactions:
            amount = round(float(t["amount"]), -2)
            if amount not in by_amount:
                by_amount[amount] = []
            by_amount[amount].append(t)

        for amount, group in by_amount.items():
            if len(group) >= 2:
                ids = [t["id"] for t in group]
                total = sum(float(t["amount"]) for t in group)
                results.append({
                    "pattern_type": "DUPLICIDAD_PAGOS",
                    "description": f"Se detectaron {len(group)} pagos con monto similar {amount:,.0f}",
                    "confidence": min(0.95, 0.5 + len(group) * 0.15),
                    "amount": total,
                    "estimated_loss": total / 2,
                    "severity": "ALTA" if total > 5000000 else "MEDIA",
                    "involved_transactions": ids,
                })

        return results

    def detect_suspicious_transfers(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []

        for t in transactions:
            amount = float(t["amount"])
            if amount >= 100000 and amount % 100000 == 0:
                results.append({
                    "pattern_type": "TRANSFERENCIAS_SOSPECHOSAS",
                    "description": f"Monto redondo sospechoso: {amount:,.0f}",
                    "confidence": 0.7,
                    "amount": amount,
                    "estimated_loss": amount * 0.1,
                    "severity": "MEDIA",
                    "involved_transactions": [t["id"]],
                })

        return results

    def detect_ghost_payments(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        no_receipt = [t for t in transactions if "recibo" not in str(t.get("metadata", {})).lower()
                      and t.get("type") in ["pago", "transferencia", "egreso"]]

        if no_receipt:
            total = sum(float(t["amount"]) for t in no_receipt)
            ids = [t["id"] for t in no_receipt]
            results.append({
                "pattern_type": "PAGOS_FANTASMA",
                "description": f"{len(no_receipt)} pagos sin respaldo documental por {total:,.0f}",
                "confidence": 0.6,
                "amount": total,
                "estimated_loss": total,
                "severity": "CRITICA" if total > 10000000 else "ALTA",
                "involved_transactions": ids,
            })

        return results
