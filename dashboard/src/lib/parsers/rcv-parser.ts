import type { RegistroComprasVentas } from '@shared/types/rcv'

const HEADER_MAP: Record<string, keyof RegistroComprasVentas> = {
  'periodo': 'periodo',
  'folio': 'folio',
  'rut': 'rut',
  'razon social': 'razonSocial',
  'razón social': 'razonSocial',
  'tipo documento': 'tipoDocumento',
  'tipo': 'tipo',
  'fecha': 'fecha',
  'monto neto': 'montoNeto',
  'monto iva': 'montoIva',
  'monto exento': 'montoExento',
  'monto total': 'montoTotal',
  'iva recuperable': 'ivaRecuperable',
  'codigo sii': 'codigoSII',
  'código sii': 'codigoSII',
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

function mapRow(row: Record<string, string>): RegistroComprasVentas {
  return {
    periodo: row.periodo || '',
    tipo: (row.tipo?.toUpperCase()?.includes('COMPRA') ? 'COMPRA' : 'VENTA') as 'COMPRA' | 'VENTA',
    rut: row.rut || '',
    razonSocial: row.razonSocial || '',
    tipoDocumento: parseInt(row.tipoDocumento || '0') || 0,
    folio: parseInt(row.folio || '0') || 0,
    fecha: row.fecha || '',
    montoNeto: parseFloat(row.montoNeto?.replace(/\./g, '').replace(',', '.') || '0'),
    montoIva: parseFloat(row.montoIva?.replace(/\./g, '').replace(',', '.') || '0'),
    montoExento: parseFloat(row.montoExento?.replace(/\./g, '').replace(',', '.') || '0'),
    montoTotal: parseFloat(row.montoTotal?.replace(/\./g, '').replace(',', '.') || '0'),
    ivaRecuperable: parseFloat(row.ivaRecuperable?.replace(/\./g, '').replace(',', '.') || '0'),
    codigoSII: row.codigoSII || undefined,
  }
}

export function parseRCV(csvContent: string): RegistroComprasVentas[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim())
  const headerMapping: Record<number, keyof RegistroComprasVentas> = {}
  
  headers.forEach((header, index) => {
    const mapped = HEADER_MAP[header]
    if (mapped) {
      headerMapping[index] = mapped
    }
  })
  
  const results: RegistroComprasVentas[] = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    
    values.forEach((value, index) => {
      const key = headerMapping[index]
      if (key) {
        row[key] = value.replace(/"/g, '')
      }
    })
    
    if (Object.keys(row).length > 0) {
      results.push(mapRow(row))
    }
  }
  
  return results
}
