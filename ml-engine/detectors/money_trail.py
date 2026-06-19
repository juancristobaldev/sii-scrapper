from typing import List, Dict, Any
from collections import defaultdict


class MoneyTrailAnalyzer:
    def analyze(self, transactions: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
        issues = []

        ingresos = self._sum_by_type(transactions, ["venta", "ingreso", "deposito", "cobro"])
        egresos = self._sum_by_type(transactions, ["compra", "egreso", "pago", "transferencia"])
        ajustes = self._sum_by_type(transactions, ["ajuste", "rebaja", "descuento", "nota_credito"])

        discrepancy = abs(ingresos - egresos)
        if ingresos > 0:
            ratio = discrepancy / ingresos
            if ratio > 0.1:
                issues.append({
                    "issue": "DESCUADRE_INGRESOS_EGRESOS",
                    "description": f"Diferencia significativa entre ingresos ({ingresos:,.0f}) y egresos ({egresos:,.0f})",
                    "difference": discrepancy,
                    "difference_pct": round(ratio * 100, 1),
                    "severity": "CRITICA" if ratio > 0.3 else "ALTA",
                })
            elif ratio > 0.02:
                issues.append({
                    "issue": "DESCUADRE_MENOR",
                    "description": f"Pequeña diferencia entre ingresos y egresos: {discrepancy:,.0f}",
                    "difference": discrepancy,
                    "difference_pct": round(ratio * 100, 1),
                    "severity": "MEDIA",
                })

        cash_flow = self._analyze_cash_flow(transactions, config)
        issues.extend(cash_flow)

        missing_deposits = self._detect_missing_deposits(transactions)
        issues.extend(missing_deposits)

        hidden_movements = self._detect_hidden_movements(transactions)
        issues.extend(hidden_movements)

        return issues

    def _sum_by_type(self, transactions: List[Dict[str, Any]], types: List[str]) -> float:
        return sum(float(t["amount"]) for t in transactions if t.get("type", "").lower() in types)

    def _analyze_cash_flow(self, transactions: List[Dict[str, Any]], config: Dict[str, Any]) -> List[Dict[str, Any]]:
        issues = []

        cash_in = [t for t in transactions if t.get("type") in ["efectivo", "caja", "ingreso_caja"]]
        cash_out = [t for t in transactions if t.get("type") in ["rebaja", "retiro_caja", "egreso_caja"]]

        if cash_in:
            total_in = sum(float(t["amount"]) for t in cash_in)
            total_out = sum(float(t["amount"]) for t in cash_out)
            diff = total_in - total_out

            if diff < 0:
                issues.append({
                    "issue": "CAJA_NEGATIVA",
                    "description": f"Mas egresos que ingresos en caja: diferencia {abs(diff):,.0f}",
                    "difference": abs(diff),
                    "severity": "CRITICA",
                })
            elif total_in > 0 and total_out / total_in < 0.5:
                issues.append({
                    "issue": "EFECTIVO_NO_DECLARADO",
                    "description": f"Efectivo ingresado ({total_in:,.0f}) supera largamente lo declarado ({total_out:,.0f})",
                    "difference": total_in - total_out,
                    "severity": "ALTA",
                })

        return issues

    def _detect_missing_deposits(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        ventas = sum(float(t["amount"]) for t in transactions if t.get("type") in ["venta", "factura"])
        depositos = sum(float(t["amount"]) for t in transactions if t.get("type") in ["deposito", "abono"])

        if ventas > 0 and depositos == 0:
            return [{
                "issue": "SIN_DEPOSITOS",
                "description": f"Ventas por {ventas:,.0f} sin depositos bancarios registrados",
                "difference": ventas,
                "severity": "CRITICA",
            }]

        if ventas > 0 and depositos < ventas * 0.7:
            return [{
                "issue": "DEPOSITOS_INSUFICIENTES",
                "description": f"Ventas ({ventas:,.0f}) vs depositos ({depositos:,.0f}): brecha de {ventas - depositos:,.0f}",
                "difference": ventas - depositos,
                "severity": "ALTA",
            }]

        return []

    def _detect_hidden_movements(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        no_source = [t for t in transactions if not t.get("source") or t["source"] == "desconocido"]
        if no_source:
            total = sum(float(t["amount"]) for t in no_source)
            return [{
                "issue": "MOVIMIENTOS_OCULTOS",
                "description": f"{len(no_source)} movimientos sin origen identificable por {total:,.0f}",
                "difference": total,
                "severity": "ALTA" if total > 1000000 else "MEDIA",
            }]
        return []
