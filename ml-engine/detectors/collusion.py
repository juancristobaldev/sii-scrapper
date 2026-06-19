from typing import List, Dict, Any
from collections import defaultdict


class CollusionDetector:
    def detect(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        indicators = []

        user_provider_pairs = self._find_user_provider_pairs(transactions)
        indicators.extend(user_provider_pairs)

        user_amount_patterns = self._find_user_amount_patterns(transactions)
        indicators.extend(user_amount_patterns)

        sequential_approvals = self._find_sequential_approvals(transactions)
        indicators.extend(sequential_approvals)

        return indicators

    def _find_user_provider_pairs(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        pairs = defaultdict(list)
        for t in transactions:
            user = t.get("user_name") or t.get("user_id", "")
            provider = t.get("metadata", {}).get("provider", "") if isinstance(t.get("metadata"), dict) else ""
            if user and provider:
                key = f"{user}::{provider}"
                pairs[key].append(t)

        results = []
        for key, group in pairs.items():
            if len(group) >= 5:
                user, provider = key.split("::")
                total = sum(float(t["amount"]) for t in group)
                results.append({
                    "indicator": "RELACION_USUARIO_PROVEEDOR",
                    "description": f"Usuario '{user}' tiene {len(group)} transacciones con proveedor '{provider}'",
                    "confidence": min(0.9, 0.5 + len(group) * 0.05),
                    "total_amount": total,
                    "transaction_count": len(group),
                    "user": user,
                    "provider": provider,
                })
        return results

    def _find_user_amount_patterns(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        by_user = defaultdict(list)
        for t in transactions:
            user = t.get("user_name") or t.get("user_id", "")
            if user:
                by_user[user].append(float(t["amount"]))

        results = []
        for user, amounts in by_user.items():
            if len(amounts) < 3:
                continue
            mean = sum(amounts) / len(amounts)
            above_mean = sum(1 for a in amounts if a > mean * 2)
            if above_mean >= 3:
                total = sum(amounts)
                results.append({
                    "indicator": "PATRON_USUARIO_ANOMALO",
                    "description": f"Usuario '{user}' muestra patron de montos elevados ({above_mean} transacciones >2x promedio)",
                    "confidence": 0.7,
                    "total_amount": total,
                    "transaction_count": len(amounts),
                    "user": user,
                })
        return results

    def _find_sequential_approvals(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sorted_tx = sorted(
            [t for t in transactions if t.get("user_name") or t.get("user_id")],
            key=lambda t: t.get("date", "")
        )

        results = []
        for i in range(len(sorted_tx) - 2):
            u1 = sorted_tx[i].get("user_name") or sorted_tx[i].get("user_id", "")
            u2 = sorted_tx[i + 1].get("user_name") or sorted_tx[i + 1].get("user_id", "")
            u3 = sorted_tx[i + 2].get("user_name") or sorted_tx[i + 2].get("user_id", "")

            unique_users = len(set([u1, u2, u3]))
            if unique_users >= 2 and unique_users < 3:
                a1 = float(sorted_tx[i]["amount"])
                a2 = float(sorted_tx[i + 1]["amount"])
                a3 = float(sorted_tx[i + 2]["amount"])

                if 0.8 <= a1 / (a2 or 1) <= 1.2 and 0.8 <= a2 / (a3 or 1) <= 1.2:
                    results.append({
                        "indicator": "APROBACIONES_SECUENCIALES",
                        "description": f"Posible colusion: aprobaciones secuenciales de montos similares por usuarios {u1}, {u2}, {u3}",
                        "confidence": 0.6,
                        "total_amount": a1 + a2 + a3,
                        "users_involved": [u1, u2, u3],
                    })
        return results[:5]
