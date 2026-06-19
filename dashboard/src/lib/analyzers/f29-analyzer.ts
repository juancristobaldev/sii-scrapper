import type { F29Data, RegistroComprasVentas } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function analyzeF29vsRCV(f29Data: F29Data[], rcv: RegistroComprasVentas[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  const ventasRCV = rcv.filter(r => r.tipo === 'VENTA')
  const comprasRCV = rcv.filter(r => r.tipo === 'COMPRA')

  const ivaDebitoRCV = ventasRCV.reduce((sum, r) => sum + r.montoIva, 0)
  const ivaCreditoRCV = comprasRCV.reduce((sum, r) => sum + r.montoIva, 0)

  const f29Debito = f29Data.find(f => f.codigo === 51 || f.descripcion?.toLowerCase().includes('debito'))?.valor || 0
  const f29Credito = f29Data.find(f => f.codigo === 52 || f.descripcion?.toLowerCase().includes('credito'))?.valor || 0

  if (f29Debito > 0 && ivaDebitoRCV > 0) {
    const diff = Math.abs(f29Debito - ivaDebitoRCV)
    const pctDiff = diff / f29Debito
    if (pctDiff > 0.05 && diff > 100) {
      diagnostics.push({
        id: 'f29-iva-debito',
        categoria: 'ERROR_IVA',
        severidad: 'ALTA',
        titulo: 'Diferencia IVA Debito F29 vs RCV',
        descripcion: `F29 declara IVA debito de $${f29Debito.toLocaleString()} pero RCV suma $${ivaDebitoRCV.toLocaleString()}. Diferencia: $${diff.toLocaleString()} (${(pctDiff * 100).toFixed(1)}%).`,
        evidencia: { f29Debito, ivaDebitoRCV, diferencia: diff, porcentaje: pctDiff },
        impactoEstimado: diff,
        recomendacion: 'Conciliar F29 con RCV. Identificar documentos faltantes en RCV o mal declarados en F29.',
        resuelto: false,
      })
    }
  }

  if (f29Credito > 0 && ivaCreditoRCV > 0) {
    const diff = Math.abs(f29Credito - ivaCreditoRCV)
    const pctDiff = diff / f29Credito
    if (pctDiff > 0.05 && diff > 100) {
      diagnostics.push({
        id: 'f29-iva-credito',
        categoria: 'ERROR_IVA',
        severidad: 'ALTA',
        titulo: 'Diferencia IVA Credito F29 vs RCV',
        descripcion: `F29 declara IVA credito de $${f29Credito.toLocaleString()} pero RCV suma $${ivaCreditoRCV.toLocaleString()}. Diferencia: $${diff.toLocaleString()} (${(pctDiff * 100).toFixed(1)}%).`,
        evidencia: { f29Credito, ivaCreditoRCV, diferencia: diff, porcentaje: pctDiff },
        impactoEstimado: diff,
        recomendacion: 'Verificar que todas las facturas de compra esten registradas en RCV y declaradas en F29.',
        resuelto: false,
      })
    }
  }

  const ivaDeterminado = f29Data.find(f => f.codigo === 53 || f.descripcion?.toLowerCase().includes('determinado'))?.valor || 0
  const ivaEsperado = f29Debito - (f29Credito + (f29Data.find(f => f.codigo === 54)?.valor || 0))

  if (Math.abs(ivaDeterminado - ivaEsperado) > 100 && f29Debito > 0) {
    diagnostics.push({
      id: 'f29-iva-determinado',
      categoria: 'ERROR_IVA',
      severidad: 'CRITICA',
      titulo: 'IVA Determinado inconsistente en F29',
      descripcion: `IVA determinado en F29: $${ivaDeterminado.toLocaleString()}. Calculo esperado: $${ivaEsperado.toLocaleString()}.`,
      evidencia: { ivaDeterminado, ivaEsperado, f29Debito, f29Credito },
      impactoEstimado: Math.abs(ivaDeterminado - ivaEsperado),
      recomendacion: 'Revisar la declaracion F29. El IVA determinado no coincide con el calculo de debito - credito. Rectificar si es necesario.',
      resuelto: false,
    })
  }

  return diagnostics
}
