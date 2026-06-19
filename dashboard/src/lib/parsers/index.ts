import type { DTE, RegistroComprasVentas, F29Data, SIIExtractedData } from '@shared/types'
import { parseRCV } from './rcv-parser'
import { parseDTE } from './dte-parser'
import { parseF29 } from './f29-parser'

export type DataSection = 'rcv' | 'dteEmitidos' | 'dteRecibidos' | 'f29' | 'librosElectronicos' | 'situacionTributaria' | 'boletas' | 'facturacionElectronica'

export function parseCSV(csvContent: string, section: DataSection): unknown[] {
  switch (section) {
    case 'rcv':
      return parseRCV(csvContent)
    case 'dteEmitidos':
    case 'dteRecibidos':
      return parseDTE(csvContent)
    case 'f29':
      return parseF29(csvContent)
    default:
      return []
  }
}

export function parseUploadedData(data: Record<DataSection, string>): Partial<SIIExtractedData> {
  const result: Partial<SIIExtractedData> = {}

  if (data.rcv) result.rcv = parseRCV(data.rcv)
  if (data.dteEmitidos) result.dteEmitidos = parseDTE(data.dteEmitidos)
  if (data.dteRecibidos) result.dteRecibidos = parseDTE(data.dteRecibidos)
  if (data.f29) result.f29 = parseF29(data.f29)

  return result
}
