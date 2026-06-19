import type { RegistroComprasVentas } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function detectAnomalies(rcv: RegistroComprasVentas[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  if (rcv.length < 10) return diagnostics

  const montos = rcv.map(r => r.montoTotal).sort((a, b) => a - b)
  const n = montos.length

  const q1 = montos[Math.floor(n * 0.25)]
  const q3 = montos[Math.floor(n * 0.75)]
  const iqr = q3 - q1
  const lowerBound = q1 - 1.5 * iqr
  const upperBound = q3 + 1.5 * iqr

  const outliers = rcv.filter(r => r.montoTotal > upperBound && r.montoTotal > q3 * 3)
  
  for (const o of outliers.slice(0, 5)) {
    diagnostics.push({
      id: `anomaly-monto-${o.tipoDocumento}-${o.folio}-${o.rut}`,
      categoria: 'ANOMALIA_MONTO',
      severidad: 'MEDIA',
      titulo: `Monto atipico detectado - Doc ${o.tipoDocumento} Folio ${o.folio}`,
      descripcion: `Monto de $${o.montoTotal.toLocaleString()} esta muy por encima del patron normal (limite superior: $${upperBound.toLocaleString()}, Q3: $${q3.toLocaleString()}).`,
      evidencia: {
        monto: o.montoTotal,
        limiteSuperior: upperBound,
        q1,
        q3,
        iqr,
        tipoDocumento: o.tipoDocumento,
        folio: o.folio,
        rut: o.rut,
        razonSocial: o.razonSocial,
      },
      impactoEstimado: 0,
      recomendacion: 'Revisar si el monto es correcto. Un monto atipico puede indicar error de digitacion o una operacion inusual que requiere documentacion adicional.',
      resuelto: false,
    })
  }

  const avgMonto = montos.reduce((a, b) => a + b, 0) / n
  const stdDev = Math.sqrt(montos.reduce((sum, m) => sum + Math.pow(m - avgMonto, 2), 0) / n)
  const cv = stdDev / (avgMonto || 1)

  if (cv > 3) {
    diagnostics.push({
      id: 'anomaly-alta-variabilidad',
      categoria: 'ANOMALIA_MONTO',
      severidad: 'BAJA',
      titulo: 'Alta variabilidad en montos de documentos',
      descripcion: `Coeficiente de variacion: ${cv.toFixed(2)}. El promedio es $${avgMonto.toLocaleString()} con desviacion de $${stdDev.toLocaleString()}.`,
      evidencia: { promedio: avgMonto, desviacion: stdDev, coeficienteVariacion: cv },
      impactoEstimado: 0,
      recomendacion: 'Alta variabilidad puede ser normal segun el giro. Revisar si hay categorizacion incorrecta de documentos.',
      resuelto: false,
    })
  }

  const docsPorDia = new Map<string, number>()
  for (const r of rcv) {
    docsPorDia.set(r.fecha, (docsPorDia.get(r.fecha) || 0) + 1)
  }

  for (const [fecha, count] of docsPorDia) {
    if (count > 20) {
      diagnostics.push({
        id: `anomaly-volumen-${fecha}`,
        categoria: 'ANOMALIA_MONTO',
        severidad: 'BAJA',
        titulo: `Volumen inusual de documentos - ${fecha}`,
        descripcion: `${count} documentos registrados el ${fecha}. Podria indicar carga masiva o error.`,
        evidencia: { fecha, cantidad: count },
        impactoEstimado: 0,
        recomendacion: 'Verificar si corresponde a una carga normal de documentos o si hay duplicados.',
        resuelto: false,
      })
      break
    }
  }

  return diagnostics
}
