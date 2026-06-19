import type { DTE, RegistroComprasVentas } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function detectDuplicates(rcv: RegistroComprasVentas[], dte: (DTE | undefined)[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  const rcvKeyMap = new Map<string, RegistroComprasVentas[]>()
  for (const r of rcv) {
    const key = `${r.tipoDocumento}-${r.folio}-${r.rut}`
    if (!rcvKeyMap.has(key)) rcvKeyMap.set(key, [])
    rcvKeyMap.get(key)!.push(r)
  }

  for (const [key, items] of rcvKeyMap) {
    if (items.length > 1) {
      const montos = items.map(i => i.montoTotal)
      const uniqueMontos = new Set(montos)
      
      diagnostics.push({
        id: `dup-rcv-${key}`,
        categoria: uniqueMontos.size === 1 ? 'PAGO_DUPLICADO' : 'INCONSISTENCIA_CONTABLE',
        severidad: uniqueMontos.size === 1 ? 'CRITICA' : 'ALTA',
        titulo: uniqueMontos.size === 1 
          ? `Posible pago duplicado - RCV ${key}`
          : `RCV duplicado con montos diferentes - ${key}`,
        descripcion: `El registro ${key} aparece ${items.length} veces. ${uniqueMontos.size === 1 ? `Mismo monto: $${montos[0].toLocaleString()}` : `Montos diferentes: ${montos.map(m => '$' + m.toLocaleString()).join(', ')}`}`,
        evidencia: { key, ocurrencias: items.length, montos, fechas: items.map(i => i.fecha) },
        impactoEstimado: uniqueMontos.size === 1 ? montos[0] : Math.abs(montos[0] - montos[1]),
        recomendacion: uniqueMontos.size === 1 
          ? 'Verificar si el pago se realizo dos veces. Solicitar devolucion o nota de credito.'
          : 'Identificar cual es el registro correcto y eliminar o corregir el duplicado.',
        resuelto: false,
      })
    }
  }

  if (dte.length > 0) {
    const dteByFolio = new Map<string, DTE[]>()
    for (const d of dte) {
      if (!d) continue
      const key = `${d.tipo}-${d.folio}-${d.rutEmisor}`
      if (!dteByFolio.has(key)) dteByFolio.set(key, [])
      dteByFolio.get(key)!.push(d)
    }

    for (const [key, items] of dteByFolio) {
      if (items.length > 1) {
        diagnostics.push({
          id: `dup-dte-${key}`,
          categoria: 'PAGO_DUPLICADO',
          severidad: 'CRITICA',
          titulo: `DTE duplicado - Tipo ${items[0].tipo} Folio ${items[0].folio}`,
          descripcion: `El DTE de ${items[0].razonSocialEmisor} aparece ${items.length} veces. Monto: $${items[0].montoTotal.toLocaleString()}.`,
          evidencia: { tipo: items[0].tipo, folio: items[0].folio, emisor: items[0].razonSocialEmisor, ocurrencias: items.length },
          impactoEstimado: items[0].montoTotal,
          recomendacion: 'Verificar si se pago dos veces la misma factura. Solicitar devolucion al proveedor.',
          resuelto: false,
        })
      }
    }
  }

  return diagnostics
}
