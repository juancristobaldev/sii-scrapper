import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function calculateRiskScore(diagnostics: DiagnosticoItem[]): { score: number; distribucion: Record<string, number>; fugasTotal: number; riesgoFiscal: number } {
  const severidadPesos: Record<string, number> = {
    CRITICA: 25,
    ALTA: 10,
    MEDIA: 4,
    BAJA: 1,
  }

  let totalScore = 0
  const distribucion: Record<string, number> = { CRITICA: 0, ALTA: 0, MEDIA: 0, BAJA: 0 }
  let fugasTotal = 0
  let riesgoFiscal = 0

  for (const d of diagnostics) {
    distribucion[d.severidad] = (distribucion[d.severidad] || 0) + 1
    totalScore += severidadPesos[d.severidad] || 0

    if (d.categoria === 'FUGA_DINERO' || d.categoria === 'PAGO_DUPLICADO') {
      fugasTotal += d.impactoEstimado || 0
    }

    if (d.categoria === 'RIESGO_TRIBUTARIO' || d.categoria === 'ERROR_IVA' || d.categoria === 'FACTURACION_ELECTRONICA') {
      riesgoFiscal += d.impactoEstimado || 0
    }
  }

  const maxScore = diagnostics.length * 25
  const healthScore = maxScore > 0 ? Math.max(0, Math.round(100 - (totalScore / maxScore) * 100)) : 100

  return { score: healthScore, distribucion, fugasTotal, riesgoFiscal }
}
