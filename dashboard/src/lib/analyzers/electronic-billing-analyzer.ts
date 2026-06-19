import type { DTE } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function analyzeElectronicBilling(dteEmitidos: DTE[], dteRecibidos: DTE[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  const sinTrackId = [...dteEmitidos, ...dteRecibidos].filter(d => !d.trackId)
  if (sinTrackId.length > 0) {
    diagnostics.push({
      id: 'eb-sin-trackid',
      categoria: 'FACTURACION_ELECTRONICA',
      severidad: 'ALTA',
      titulo: `${sinTrackId.length} DTEs sin Track ID`,
      descripcion: 'Los DTEs sin Track ID pueden no estar validamente emitidos en el sistema de facturacion electronica del SII.',
      evidencia: { cantidad: sinTrackId.length, ejemplos: sinTrackId.slice(0, 3).map(d => ({ tipo: d.tipo, folio: d.folio })) },
      impactoEstimado: sinTrackId.reduce((sum, d) => sum + d.montoIva, 0),
      recomendacion: 'Verificar que todos los DTEs esten timbrados electronicamente. Emitir los DTEs faltantes en el portal del SII.',
      resuelto: false,
    })
  }

  const rechazados = dteRecibidos.filter(d => d.estado === 'RECHAZADO')
  if (rechazados.length > 0) {
    const montoIvaPerdido = rechazados.reduce((sum, d) => sum + d.montoIva, 0)
    diagnostics.push({
      id: 'eb-dte-rechazados',
      categoria: 'FACTURACION_ELECTRONICA',
      severidad: 'ALTA',
      titulo: `${rechazados.length} DTEs recibidos RECHAZADOS`,
      descripcion: `IVA credito en riesgo: $${montoIvaPerdido.toLocaleString()}. Los DTEs rechazados no permiten usar el IVA como credito fiscal.`,
      evidencia: { cantidad: rechazados.length, montoIvaPerdido, ejemplos: rechazados.slice(0, 3).map(d => ({ tipo: d.tipo, folio: d.folio, emisor: d.razonSocialEmisor })) },
      impactoEstimado: montoIvaPerdido,
      recomendacion: 'Reclamar los DTEs rechazados dentro del plazo (8 dias). Solicitar nota de credito si no se resuelve el reclamo.',
      resuelto: false,
    })
  }

  const anulados = dteEmitidos.filter(d => d.estado === 'ANULADO')
  if (anulados.length > 0) {
    const montoTotal = anulados.reduce((sum, d) => sum + d.montoTotal, 0)
    diagnostics.push({
      id: 'eb-dte-anulados',
      categoria: 'FACTURACION_ELECTRONICA',
      severidad: 'MEDIA',
      titulo: `${anulados.length} DTEs emitidos ANULADOS`,
      descripcion: `Monto total anulado: $${montoTotal.toLocaleString()}. Verificar que todos tengan su nota de credito correspondiente.`,
      evidencia: { cantidad: anulados.length, montoTotal },
      impactoEstimado: 0,
      recomendacion: 'Verificar que existen las notas de credito correspondientes en el RCV.',
      resuelto: false,
    })
  }

  const tiposDocumento = new Map<number, number>()
  for (const d of dteEmitidos) {
    tiposDocumento.set(d.tipo, (tiposDocumento.get(d.tipo) || 0) + 1)
  }

  const requiredTypes = [33, 34, 39, 41, 56, 61]
  for (const tipo of requiredTypes) {
    if (!tiposDocumento.has(tipo)) {
      diagnostics.push({
        id: `eb-falta-tipo-${tipo}`,
        categoria: 'INCUMPLIMIENTO_FORMAL',
        severidad: 'BAJA',
        titulo: `Sin DTEs de tipo ${tipo} en el periodo`,
        descripcion: `No se encontraron documentos tipo ${tipo} (${getTipoDescripcion(tipo)}). Verificar si corresponde a tu operacion.`,
        evidencia: { tipo },
        impactoEstimado: 0,
        recomendacion: 'Si tu operacion requiere este tipo de documento, verifica que se esten emitiendo correctamente.',
        resuelto: false,
      })
    }
  }

  return diagnostics
}

function getTipoDescripcion(tipo: number): string {
  const map: Record<number, string> = {
    33: 'Factura electronica',
    34: 'Factura no afecta o exenta',
    39: 'Boleta electronica',
    41: 'Boleta exenta',
    56: 'Nota de debito',
    61: 'Nota de credito',
  }
  return map[tipo] || 'Desconocido'
}
