import type { DTE, RegistroComprasVentas } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function analyzeTimeline(rcv: RegistroComprasVentas[], dte: DTE[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  for (const d of dte) {
    if (d.fechaRecepcion && d.fechaEmision) {
      const fechaEmision = new Date(d.fechaEmision)
      const fechaRecepcion = new Date(d.fechaRecepcion)
      
      if (fechaEmision > fechaRecepcion) {
        diagnostics.push({
          id: `timeline-dte-${d.tipo}-${d.folio}`,
          categoria: 'INCONSISTENCIA_CONTABLE',
          severidad: 'MEDIA',
          titulo: 'Fecha de emision posterior a recepcion',
          descripcion: `DTE ${d.tipo} Folio ${d.folio}: emitido el ${d.fechaEmision}, recibido el ${d.fechaRecepcion}.`,
          evidencia: { tipo: d.tipo, folio: d.folio, fechaEmision: d.fechaEmision, fechaRecepcion: d.fechaRecepcion },
          impactoEstimado: 0,
          recomendacion: 'Verificar las fechas. La recepcion no puede ser anterior a la emision.',
          resuelto: false,
        })
      }

      const diffDays = Math.abs((fechaRecepcion.getTime() - fechaEmision.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays > 365) {
        diagnostics.push({
          id: `timeline-antiguo-${d.tipo}-${d.folio}`,
          categoria: 'RIESGO_TRIBUTARIO',
          severidad: 'BAJA',
          titulo: 'Documento con mas de 1 ano de antiguedad',
          descripcion: `DTE ${d.tipo} Folio ${d.folio} emitido el ${d.fechaEmision}. ${diffDays.toFixed(0)} dias de antiguedad.`,
          evidencia: { tipo: d.tipo, folio: d.folio, dias: diffDays },
          impactoEstimado: 0,
          recomendacion: 'Verificar si el IVA de este documento aun es recuperable. El plazo general es de 1 ano.',
          resuelto: false,
        })
      }
    }
  }

  const sortedRCV = [...rcv].sort((a, b) => a.fecha.localeCompare(b.fecha))
  if (sortedRCV.length > 2) {
    let maxGap = 0
    let gapStart = ''
    let gapEnd = ''
    
    for (let i = 1; i < sortedRCV.length; i++) {
      const d1 = new Date(sortedRCV[i-1].fecha)
      const d2 = new Date(sortedRCV[i].fecha)
      const gapDays = (d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)
      
      if (gapDays > maxGap) {
        maxGap = gapDays
        gapStart = sortedRCV[i-1].fecha
        gapEnd = sortedRCV[i].fecha
      }
    }

    if (maxGap > 60) {
      diagnostics.push({
        id: 'timeline-gap-rcv',
        categoria: 'DOCUMENTO_FALTANTE',
        severidad: 'ALTA',
        titulo: 'Periodo sin movimientos en RCV',
        descripcion: `Se detectaron ${maxGap.toFixed(0)} dias sin registros entre ${gapStart} y ${gapEnd}.`,
        evidencia: { diasSinRegistro: maxGap, desde: gapStart, hasta: gapEnd },
        impactoEstimado: 0,
        recomendacion: 'Verificar si hubo actividad en ese periodo. Podrian faltar documentos por registrar.',
        resuelto: false,
      })
    }
  }

  return diagnostics
}
