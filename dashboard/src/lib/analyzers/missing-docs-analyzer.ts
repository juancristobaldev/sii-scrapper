import type { DTE, RegistroComprasVentas } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function findMissingDocuments(rcv: RegistroComprasVentas[], dteRecibidos: DTE[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  const rcvByRut = new Map<string, RegistroComprasVentas[]>()
  for (const r of rcv) {
    const key = `${r.tipoDocumento}-${r.rut}`
    if (!rcvByRut.has(key)) rcvByRut.set(key, [])
    rcvByRut.get(key)!.push(r)
  }

  for (const [key, items] of rcvByRut) {
    items.sort((a, b) => a.folio - b.folio)
    for (let i = 1; i < items.length; i++) {
      const gap = items[i].folio - items[i-1].folio
      if (gap > 2 && gap < 50) {
        const missingStart = items[i-1].folio + 1
        const missingEnd = items[i].folio - 1
        diagnostics.push({
          id: `missing-folios-${key}`,
          categoria: 'DOCUMENTO_FALTANTE',
          severidad: 'MEDIA',
          titulo: `Posibles folios faltantes - Doc tipo ${key.split('-')[0]}`,
          descripcion: `RUT ${key.split('-')[1]}: entre folio ${items[i-1].folio} y ${items[i].folio} hay ${gap - 1} folios sin registrar (${missingStart} al ${missingEnd}).`,
          evidencia: { tipoDocumento: key.split('-')[0], rut: key.split('-')[1], desde: items[i-1].folio, hasta: items[i].folio, faltantes: gap - 1 },
          impactoEstimado: 0,
          recomendacion: 'Verificar si existen documentos no registrados en esos folios. Podrian ser facturas anuladas o extraviadas.',
          resuelto: false,
        })
      }
    }
  }

  if (dteRecibidos.length > 0 && rcv.length > 0) {
    const comprasRCV = new Set(rcv.filter(r => r.tipo === 'COMPRA').map(r => `${r.tipoDocumento}-${r.folio}-${r.rut}`))
    
    for (const d of dteRecibidos) {
      const key = `${d.tipo}-${d.folio}-${d.rutEmisor}`
      if (!comprasRCV.has(key)) {
        diagnostics.push({
          id: `missing-rcv-${key}`,
          categoria: 'DOCUMENTO_FALTANTE',
          severidad: 'ALTA',
          titulo: 'DTE recibido no registrado en RCV de compras',
          descripcion: `El DTE ${d.tipo} Folio ${d.folio} de ${d.razonSocialEmisor} por $${d.montoTotal.toLocaleString()} fue recibido pero no esta en el RCV de compras.`,
          evidencia: { tipo: d.tipo, folio: d.folio, emisor: d.razonSocialEmisor, montoTotal: d.montoTotal, montoIva: d.montoIva },
          impactoEstimado: d.montoIva,
          recomendacion: 'Registrar el documento en el RCV de compras para usar el IVA credito.',
          resuelto: false,
        })
      }
    }
  }

  return diagnostics
}
