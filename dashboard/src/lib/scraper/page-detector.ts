import type { ExtractedTable } from './types'

const PAGE_PATTERNS: Record<string, RegExp[]> = {
  rcv: [/rcv/i, /registro\s+(de\s+)?compras?\s+y\s+ventas/i, /compras?\s+y\s+ventas/i],
  'dte-emitidos': [/dte\s+emitidos?/i, /documentos?\s+tributarios?\s+emitidos?/i, /emitidos/i],
  'dte-recibidos': [/dte\s+recibidos?/i, /documentos?\s+tributarios?\s+recibidos?/i, /recibidos/i],
  f29: [/f\.?29/i, /formulario\s+29/i, /declaracion\s+mensual/i, /declaraci[oó]n\s+mensual/i],
  situacion: [/situaci[oó]n\s+tributaria/i, /estado\s+del\s+contribuyente/i],
  boletas: [/boletas?\s+(de\s+)?honorarios?/i, /boletas?\s+emitidas?/i, /boletas?\s+electr[oó]nicas?/i],
  facturacion: [/facturaci[oó]n\s+electr[oó]nica/i, /factura\s+electr[oó]nica/i, /timbrado/i],
  libros: [/libros?\s+electr[oó]nicos?/i, /libro\s+de\s+compras/i, /libro\s+de\s+ventas/i],
}

export function detectPageType(html: string, url: string): string | null {
  const normalizedHtml = html.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const normalizedUrl = url.toLowerCase()

  for (const [pageType, patterns] of Object.entries(PAGE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedUrl) || pattern.test(normalizedHtml)) {
        return pageType
      }
    }
  }

  return null
}

export function detectAuthenticated(html: string): boolean {
  if (html.includes('IngresoRutClave') || html.includes('InicioAutenticacion')) {
    return false
  }

  if (html.includes('RUT') && (html.includes('Contribuyente') || html.includes('contribuyente'))) {
    return true
  }

  if (html.includes('Cerrar Sesión') || html.includes('Cerrar Sesi') || html.includes('cerrar sesi')) {
    return true
  }

  if (html.includes('zeusr.sii.cl') && html.length > 2000) {
    return true
  }

  return false
}

export function extractRutFromPage(html: string): string | null {
  const rutPatterns = [
    /RUT[:\s]*(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/i,
    /RUT[:\s]*(\d{7,8}-[\dkK])/i,
    /RUT\s+Contribuyente[:\s]*(\d{1,2}\.\d{3}\.\d{3}-[\dkK])/i,
  ]

  for (const pattern of rutPatterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }

  return null
}
