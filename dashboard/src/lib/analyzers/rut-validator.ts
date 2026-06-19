import type { RegistroComprasVentas, DTE } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

function validateRut(rut: string): boolean {
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (cleaned.length < 2) return false

  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)

  let sum = 0
  let multiplier = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }

  const expectedDV = 11 - (sum % 11)
  const expectedChar = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString()
  return expectedChar === dv
}

export function validateRUTs(rcv: RegistroComprasVentas[], dte: DTE[]): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []
  const rutsSeen = new Set<string>()

  for (const r of rcv) {
    if (rutsSeen.has(r.rut)) continue
    rutsSeen.add(r.rut)

    if (!validateRut(r.rut)) {
      diagnostics.push({
        id: `rut-invalido-rcv-${r.rut}`,
        categoria: 'INCONSISTENCIA_CONTABLE',
        severidad: 'ALTA',
        titulo: `RUT invalido en RCV: ${r.rut}`,
        descripcion: `El RUT ${r.rut} (${r.razonSocial}) no es valido segun algoritmo de verificacion.`,
        evidencia: { rut: r.rut, razonSocial: r.razonSocial, tipoDocumento: r.tipoDocumento, folio: r.folio },
        impactoEstimado: r.montoTotal,
        recomendacion: 'Corregir el RUT en el registro. Un RUT invalido puede causar rechazo del IVA credito.',
        resuelto: false,
      })
    }
  }

  for (const d of dte) {
    if (!validateRut(d.rutEmisor)) {
      diagnostics.push({
        id: `rut-invalido-dte-e-${d.rutEmisor}-${d.folio}`,
        categoria: 'INCONSISTENCIA_CONTABLE',
        severidad: 'CRITICA',
        titulo: `RUT emisor invalido en DTE ${d.tipo} Folio ${d.folio}`,
        descripcion: `El RUT del emisor ${d.rutEmisor} (${d.razonSocialEmisor}) no es valido.`,
        evidencia: { rut: d.rutEmisor, razonSocial: d.razonSocialEmisor, tipo: d.tipo, folio: d.folio },
        impactoEstimado: d.montoTotal,
        recomendacion: 'Verificar la validez del documento. Un RUT de emisor invalido indica posible factura falsa.',
        resuelto: false,
      })
    }
    if (!validateRut(d.rutReceptor)) {
      diagnostics.push({
        id: `rut-invalido-dte-r-${d.rutReceptor}-${d.folio}`,
        categoria: 'INCONSISTENCIA_CONTABLE',
        severidad: 'MEDIA',
        titulo: `RUT receptor invalido en DTE ${d.tipo} Folio ${d.folio}`,
        descripcion: `El RUT del receptor ${d.rutReceptor} no es valido.`,
        evidencia: { rut: d.rutReceptor, tipo: d.tipo, folio: d.folio },
        impactoEstimado: 0,
        recomendacion: 'Corregir el RUT del receptor en el DTE emitido.',
        resuelto: false,
      })
    }
  }

  return diagnostics
}
