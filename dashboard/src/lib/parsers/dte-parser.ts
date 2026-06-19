import type { DTE } from '@shared/types/dte'

const HEADER_MAP: Record<string, keyof DTE> = {
  'tipo': 'tipo',
  'folio': 'folio',
  'rut emisor': 'rutEmisor',
  'razon social emisor': 'razonSocialEmisor',
  'razón social emisor': 'razonSocialEmisor',
  'rut receptor': 'rutReceptor',
  'razon social receptor': 'razonSocialReceptor',
  'razón social receptor': 'razonSocialReceptor',
  'fecha emision': 'fechaEmision',
  'fecha emisión': 'fechaEmision',
  'fecha recepcion': 'fechaRecepcion',
  'fecha recepción': 'fechaRecepcion',
  'monto neto': 'montoNeto',
  'monto iva': 'montoIva',
  'monto total': 'montoTotal',
  'estado': 'estado',
  'track id': 'trackId',
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function mapDTE(row: Record<string, string>): DTE {
  return {
    tipo: parseInt(row.tipo || '33'),
    folio: parseInt(row.folio || '0'),
    rutEmisor: row.rutEmisor || '',
    razonSocialEmisor: row.razonSocialEmisor || '',
    rutReceptor: row.rutReceptor || '',
    razonSocialReceptor: row.razonSocialReceptor || '',
    fechaEmision: row.fechaEmision || '',
    fechaRecepcion: row.fechaRecepcion || undefined,
    montoNeto: parseFloat(row.montoNeto?.replace(/\./g, '').replace(',', '.') || '0'),
    montoIva: parseFloat(row.montoIva?.replace(/\./g, '').replace(',', '.') || '0'),
    montoTotal: parseFloat(row.montoTotal?.replace(/\./g, '').replace(',', '.') || '0'),
    estado: 'EMITIDO',
    trackId: row.trackId || undefined,
  }
}

export function parseDTE(csvContent: string): DTE[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim())
  const headerMapping: Record<number, keyof DTE> = {}
  
  headers.forEach((header, index) => {
    const mapped = HEADER_MAP[header]
    if (mapped) headerMapping[index] = mapped
  })
  
  const results: DTE[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    values.forEach((value, index) => {
      const key = headerMapping[index]
      if (key) row[key] = value.replace(/"/g, '')
    })
    if (Object.keys(row).length > 0) results.push(mapDTE(row))
  }
  
  return results
}
