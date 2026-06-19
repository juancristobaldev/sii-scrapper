import type { SIIExtractedData, DiagnosticoItem, DiagnosticoResumen, Severidad } from '@shared/types/diagnostic'
import type { RegistroComprasVentas, DTE, F29Data, SituacionTributaria } from '@shared/types'
import { analyzeRCV } from './rcv-analyzer'
import { analyzeDTECrossReference } from './dte-cross-analyzer'
import { analyzeF29vsRCV } from './f29-analyzer'
import { detectDuplicates } from './duplicate-detector'
import { findMoneyLeaks } from './money-leak-finder'
import { analyzeTimeline } from './timeline-analyzer'
import { findMissingDocuments } from './missing-docs-analyzer'
import { validateRUTs } from './rut-validator'
import { detectAnomalies } from './anomaly-detector'
import { analyzeTaxSituation } from './tax-situation-analyzer'
import { analyzeElectronicBilling } from './electronic-billing-analyzer'
import { calculateRiskScore } from './risk-analyzer'

export function runFullDiagnosis(data: SIIExtractedData, sessionId: string): DiagnosticoResumen {
  const diagnostics: DiagnosticoItem[] = []
  const rcv = (data.rcv || []) as RegistroComprasVentas[]
  const dteEmitidos = (data.dteEmitidos || []) as DTE[]
  const dteRecibidos = (data.dteRecibidos || []) as DTE[]
  const f29Data = (data.f29 || []) as F29Data[]
  const situacion = data.situacionTributaria as SituacionTributaria | undefined

  if (rcv.length > 0) {
    diagnostics.push(...analyzeRCV(rcv))
    diagnostics.push(...detectDuplicates(rcv, []))
    diagnostics.push(...detectAnomalies(rcv))
    diagnostics.push(...analyzeTimeline(rcv, dteEmitidos))
  }

  if (dteEmitidos.length > 0 || dteRecibidos.length > 0) {
    diagnostics.push(...analyzeDTECrossReference(dteEmitidos, dteRecibidos))
    diagnostics.push(...analyzeElectronicBilling(dteEmitidos, dteRecibidos))
    diagnostics.push(...validateRUTs(rcv, [...dteEmitidos, ...dteRecibidos]))
  }

  if (f29Data.length > 0 && rcv.length > 0) {
    diagnostics.push(...analyzeF29vsRCV(f29Data, rcv))
  }

  if (rcv.length > 0 && dteRecibidos.length > 0) {
    diagnostics.push(...findMoneyLeaks(rcv, dteEmitidos, dteRecibidos))
    diagnostics.push(...findMissingDocuments(rcv, dteRecibidos))
  }

  if (situacion) {
    diagnostics.push(...analyzeTaxSituation(situacion))
  }

  const { score, distribucion, fugasTotal, riesgoFiscal } = calculateRiskScore(diagnostics)

  return {
    id: `diag-${Date.now()}`,
    sessionId,
    fechaAnalisis: new Date().toISOString(),
    periodoAnalizado: rcv.length > 0 ? rcv[0].periodo : 'No especificado',
    scoreSalud: score,
    totalHallazgos: diagnostics.length,
    distribucion: distribucion as Record<Severidad, number>,
    items: diagnostics,
    fugasDineroTotal: fugasTotal,
    riesgoFiscal,
  }
}

export { calculateRiskScore }
