import type { RegistroComprasVentas, DTE } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function findMoneyLeaks(rcv: RegistroComprasVentas[], dteEmitidos: DTE[], dteRecibidos: DTE[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  const compras = rcv.filter(r => r.tipo === 'COMPRA')
  const ventas = rcv.filter(r => r.tipo === 'VENTA')

  const ivaCredito = compras.reduce((sum, r) => sum + r.montoIva, 0)
  const ivaDebito = ventas.reduce((sum, r) => sum + r.montoIva, 0)
  const remanentePosible = ivaCredito - ivaDebito

  if (remanentePosible > 100000 && ivaDebito < ivaCredito * 0.3) {
    diagnostics.push({
      id: 'leak-iva-no-recuperado',
      categoria: 'FUGA_DINERO',
      severidad: 'ALTA',
      titulo: 'IVA credito acumulado no recuperado',
      descripcion: `Tienes $${ivaCredito.toLocaleString()} en IVA credito contra solo $${ivaDebito.toLocaleString()} en IVA debito. Remanente potencial: $${remanentePosible.toLocaleString()}. Dinero que el SII te debe.`,
      evidencia: { ivaCredito, ivaDebito, remanentePosible },
      impactoEstimado: remanentePosible,
      recomendacion: 'Verificar que todas las ventas esten facturadas. Solicitar devolucion de IVA si aplica (exportadores, cambio de sujeto, etc).',
      resuelto: false,
    })
  }

  const provedoresAltos = new Map<string, number>()
  for (const c of compras) {
    const current = provedoresAltos.get(c.rut) || 0
    provedoresAltos.set(c.rut, current + c.montoTotal)
  }

  const totalCompras = compras.reduce((sum, c) => sum + c.montoTotal, 0)
  for (const [rut, monto] of provedoresAltos) {
    const pct = monto / (totalCompras || 1)
    if (pct > 0.5) {
      const razon = compras.find(c => c.rut === rut)?.razonSocial || rut
      diagnostics.push({
        id: `leak-concentracion-${rut}`,
        categoria: 'FUGA_DINERO',
        severidad: 'MEDIA',
        titulo: `Concentracion de compras en un proveedor`,
        descripcion: `${razon} (${rut}) concentra el ${(pct * 100).toFixed(0)}% de tus compras ($${monto.toLocaleString()}).`,
        evidencia: { rut, razonSocial: razon, monto, porcentaje: pct },
        impactoEstimado: 0,
        recomendacion: 'Diversificar proveedores para reducir riesgo y mejorar poder de negociacion.',
        resuelto: false,
      })
      break
    }
  }

  if (dteRecibidos.length > 0 && compras.length > 0) {
    const recibidosMap = new Map<string, DTE>()
    for (const d of dteRecibidos) {
      const key = `${d.tipo}-${d.folio}-${d.rutEmisor}`
      recibidosMap.set(key, d)
    }

    for (const c of compras) {
      const key = `${c.tipoDocumento}-${c.folio}-${c.rut}`
      if (recibidosMap.has(key)) {
        const dte = recibidosMap.get(key)!
        if (dte.estado === 'ACEPTADO_CONTABLE' || dte.estado === 'RECIBIDO') {
          continue
        }
        if (dte.estado === 'RECLAMADO') {
          diagnostics.push({
            id: `leak-dte-reclamado-${key}`,
            categoria: 'FUGA_DINERO',
            severidad: 'ALTA',
            titulo: `DTE reclamado - IVA en riesgo`,
            descripcion: `El DTE ${c.tipoDocumento}-${c.folio} de ${c.razonSocial} esta reclamado. IVA en riesgo: $${c.montoIva.toLocaleString()}.`,
            evidencia: { tipo: c.tipoDocumento, folio: c.folio, rut: c.rut, montoIva: c.montoIva },
            impactoEstimado: c.montoIva,
            recomendacion: 'Resolver el reclamo con el proveedor para no perder el credito de IVA.',
            resuelto: false,
          })
        }
      }
    }
  }

  const ventasConProblemas = ventas.filter(v => {
    const emitido = dteEmitidos.find(d => d.folio === v.folio && d.rutReceptor === v.rut)
    return emitido === undefined
  })

  if (ventasConProblemas.length > 0) {
    const totalSinDTE = ventasConProblemas.reduce((sum, v) => sum + v.montoTotal, 0)
    diagnostics.push({
      id: 'leak-ventas-sin-dte',
      categoria: 'FUGA_DINERO',
      severidad: 'MEDIA',
      titulo: 'Ventas en RCV sin DTE emitido asociado',
      descripcion: `${ventasConProblemas.length} ventas por $${totalSinDTE.toLocaleString()} no tienen DTE emitido correspondiente. Posible omision en facturacion electronica.`,
      evidencia: { cantidad: ventasConProblemas.length, montoTotal: totalSinDTE, items: ventasConProblemas.slice(0, 5) },
      impactoEstimado: totalSinDTE * 0.19,
      recomendacion: 'Verificar y emitir los DTE faltantes para cumplir con facturacion electronica obligatoria.',
      resuelto: false,
    })
  }

  return diagnostics
}
