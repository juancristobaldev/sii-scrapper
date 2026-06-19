import type { RegistroComprasVentas } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function analyzeRCV(rcv: RegistroComprasVentas[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []
  const compras = rcv.filter(r => r.tipo === 'COMPRA')
  const ventas = rcv.filter(r => r.tipo === 'VENTA')

  const totalIvaCompras = compras.reduce((sum, r) => sum + r.montoIva, 0)
  const totalIvaVentas = ventas.reduce((sum, r) => sum + r.montoIva, 0)

  if (ventas.length > 0 && compras.length > 0) {
    const ratio = totalIvaVentas / (totalIvaCompras || 1)
    if (ratio > 5) {
      diagnostics.push({
        id: `rcv-ratio-${Date.now()}`,
        categoria: 'ERROR_IVA',
        severidad: 'ALTA',
        titulo: 'Desbalance IVA ventas vs compras',
        descripcion: `El IVA de ventas (${totalIvaVentas.toLocaleString()}) es ${ratio.toFixed(1)}x el IVA de compras (${totalIvaCompras.toLocaleString()}). Posible omisión de compras o sobre-declaración de ventas.`,
        evidencia: { totalIvaVentas, totalIvaCompras, ratio },
        impactoEstimado: Math.abs(totalIvaVentas - totalIvaCompras * 1.5),
        recomendacion: 'Revisar que todas las compras estén registradas. Verificar declaraciones F29 contra RCV.',
        resuelto: false,
      })
    }
  }

  const uniqueFolios = new Map<string, number>()
  for (const r of rcv) {
    const key = `${r.tipoDocumento}-${r.folio}-${r.rut}`
    uniqueFolios.set(key, (uniqueFolios.get(key) || 0) + 1)
  }

  for (const [key, count] of uniqueFolios) {
    if (count > 1) {
      const [tipo, folio, rut] = key.split('-')
      const items = rcv.filter(r => r.tipoDocumento === parseInt(tipo) && r.folio === parseInt(folio) && r.rut === rut)
      const montos = items.map(i => i.montoTotal)
      const allSameAmount = montos.every(m => m === montos[0])

      diagnostics.push({
        id: `rcv-dup-${key}`,
        categoria: allSameAmount ? 'PAGO_DUPLICADO' : 'INCONSISTENCIA_CONTABLE',
        severidad: allSameAmount ? 'CRITICA' : 'ALTA',
        titulo: allSameAmount ? `Posible pago duplicado - Doc ${tipo} Folio ${folio}` : `Documento duplicado con montos distintos - Doc ${tipo} Folio ${folio}`,
        descripcion: `El documento ${tipo} folio ${folio} del RUT ${rut} aparece ${count} veces en el RCV. ${allSameAmount ? 'Todos los registros tienen el mismo monto: $' + montos[0].toLocaleString() : 'Los montos varían: ' + montos.map(m => '$' + m.toLocaleString()).join(', ')}.`,
        evidencia: { tipoDocumento: tipo, folio, rut, ocurrencias: count, montos },
        impactoEstimado: allSameAmount ? montos[0] : Math.max(0, ...montos) - Math.min(...montos),
        recomendacion: allSameAmount ? 'Revisar si el pago se realizó dos veces. Solicitar nota de crédito si corresponde.' : 'Verificar cuál es el documento correcto y registrar la corrección.',
        resuelto: false,
      })
    }
  }

  for (const r of rcv) {
    const expectedIva = Math.round(r.montoNeto * 0.19)
    const diff = Math.abs(r.montoIva - expectedIva)
    if (diff > 10 && r.montoNeto > 0 && r.montoIva > 0) {
      diagnostics.push({
        id: `rcv-iva-${r.tipoDocumento}-${r.folio}-${r.rut}`,
        categoria: 'ERROR_IVA',
        severidad: 'MEDIA',
        titulo: `IVA mal calculado - Doc ${r.tipoDocumento} Folio ${r.folio}`,
        descripcion: `Monto neto: $${r.montoNeto.toLocaleString()}. IVA declarado: $${r.montoIva.toLocaleString()}. IVA esperado (19%): $${expectedIva.toLocaleString()}. Diferencia: $${diff.toLocaleString()}.`,
        evidencia: { montoNeto: r.montoNeto, ivaDeclarado: r.montoIva, ivaEsperado: expectedIva, diferencia: diff },
        impactoEstimado: diff,
        recomendacion: 'Corregir el IVA en el registro contable o verificar que el tipo de documento aplique tasa distinta.',
        resuelto: false,
      })
    }
  }

  for (const r of rcv) {
    if (r.montoTotal !== 0 && Math.abs(r.montoNeto + r.montoIva + r.montoExento - r.montoTotal) > 10) {
      diagnostics.push({
        id: `rcv-sum-${r.tipoDocumento}-${r.folio}-${r.rut}`,
        categoria: 'INCONSISTENCIA_CONTABLE',
        severidad: 'MEDIA',
        titulo: `Montos no cuadran - Doc ${r.tipoDocumento} Folio ${r.folio}`,
        descripcion: `Neto: $${r.montoNeto.toLocaleString()} + IVA: $${r.montoIva.toLocaleString()} + Exento: $${r.montoExento.toLocaleString()} = $${(r.montoNeto + r.montoIva + r.montoExento).toLocaleString()}, pero el total declarado es $${r.montoTotal.toLocaleString()}.`,
        evidencia: { montoNeto: r.montoNeto, montoIva: r.montoIva, montoExento: r.montoExento, montoTotal: r.montoTotal },
        impactoEstimado: Math.abs(r.montoNeto + r.montoIva + r.montoExento - r.montoTotal),
        recomendacion: 'Revisar los desgloses del documento. Corregir el error de suma en el registro.',
        resuelto: false,
      })
      break
    }
  }

  return diagnostics
}
