import type { DTE } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function analyzeDTECrossReference(emitidos: DTE[], recibidos: DTE[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  const emitidosMap = new Map<string, DTE>()
  for (const d of emitidos) {
    const key = `${d.tipo}-${d.folio}-${d.rutEmisor}-${d.rutReceptor}`
    emitidosMap.set(key, d)
  }

  for (const d of recibidos) {
    const key = `${d.tipo}-${d.folio}-${d.rutEmisor}-${d.rutReceptor}`
    const match = emitidosMap.get(key)

    if (match) {
      const diff = Math.abs(match.montoTotal - d.montoTotal)
      if (diff > 10) {
        diagnostics.push({
          id: `dte-cross-${key}`,
          categoria: 'INCONSISTENCIA_CONTABLE',
          severidad: 'ALTA',
          titulo: `Diferencia de monto en DTE cruzado - ${d.tipo} Folio ${d.folio}`,
          descripcion: `Emisor declara $${match.montoTotal.toLocaleString()}, receptor declara $${d.montoTotal.toLocaleString()}. Diferencia: $${diff.toLocaleString()}.`,
          evidencia: { emitido: match.montoTotal, recibido: d.montoTotal, diferencia: diff, tipo: d.tipo, folio: d.folio },
          impactoEstimado: diff,
          recomendacion: 'Verificar con la contraparte el monto correcto. Emitir nota de crédito/débito si corresponde.',
          resuelto: false,
        })
      }
      emitidosMap.delete(key)
    }
  }

  for (const d of recibidos) {
    if (d.estado === 'RECHAZADO') {
      diagnostics.push({
        id: `dte-rechazado-${d.tipo}-${d.folio}`,
        categoria: 'FACTURACION_ELECTRONICA',
        severidad: 'ALTA',
        titulo: `DTE rechazado - ${d.tipo} Folio ${d.folio}`,
        descripcion: `El DTE de ${d.razonSocialEmisor} fue rechazado. Monto: $${d.montoTotal.toLocaleString()}. El IVA de este documento no puede ser utilizado como crédito.`,
        evidencia: { tipo: d.tipo, folio: d.folio, emisor: d.razonSocialEmisor, montoTotal: d.montoTotal },
        impactoEstimado: d.montoIva,
        recomendacion: 'Reclamar el DTE o solicitar nota de crédito. No usar este IVA como crédito fiscal.',
        resuelto: false,
      })
    }
  }

  const totalEmitidos = emitidos.reduce((sum, d) => sum + d.montoTotal, 0)
  const totalRecibidos = recibidos.reduce((sum, d) => sum + d.montoTotal, 0)

  if (totalEmitidos > 0 && totalRecibidos > 0) {
    const ratio = totalRecibidos / totalEmitidos
    if (ratio > 3) {
      diagnostics.push({
        id: 'dte-ratio-compras-ventas',
        categoria: 'FUGA_DINERO',
        severidad: 'MEDIA',
        titulo: 'Compras muy superiores a ventas',
        descripcion: `Total DTE recibidos: $${totalRecibidos.toLocaleString()} vs emitidos: $${totalEmitidos.toLocaleString()} (ratio ${ratio.toFixed(1)}:1). Posible acumulación excesiva de IVA crédito sin recuperar.`,
        evidencia: { totalRecibidos, totalEmitidos, ratio },
        impactoEstimado: totalRecibidos * 0.19,
        recomendacion: 'Evaluar si todas las compras corresponden al giro. Verificar flujo de caja y márgenes.',
        resuelto: false,
      })
    }
  }

  return diagnostics
}
