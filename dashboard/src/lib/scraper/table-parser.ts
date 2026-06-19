import type { ExtractedTable } from './types'

export function extractTables(html: string): ExtractedTable[] {
  const tables: ExtractedTable[] = []

  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi
  let match

  while ((match = tableRegex.exec(html)) !== null) {
    const tableHtml = match[0]
    const fullMatch = match[0]

    const headers = extractHeaders(tableHtml)
    const rows = extractRows(tableHtml, headers)

    if (rows.length > 0) {
      const idMatch = fullMatch.match(/id\s*=\s*["']([^"']*)["']/i)
      const classMatch = fullMatch.match(/class\s*=\s*["']([^"']*)["']/i)

      tables.push({
        headers,
        rows,
        elementId: idMatch ? idMatch[1] : undefined,
        elementClass: classMatch ? classMatch[1] : undefined,
      })
    }
  }

  return tables
}

function extractHeaders(tableHtml: string): string[] {
  const headers: string[] = []

  const theadMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i)
  const searchHtml = theadMatch ? theadMatch[0] : tableHtml

  const firstRow = searchHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i)
  if (!firstRow) return headers

  const cellRegex = /<(?:th|td)[^>]*>([\s\S]*?)<\/(?:th|td)>/gi
  let cellMatch

  while ((cellMatch = cellRegex.exec(firstRow[0])) !== null) {
    headers.push(stripHtml(cellMatch[1]).trim().toLowerCase()
      .replace(/\s+/g, ' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  }

  return headers
}

function extractRows(tableHtml: string, headers: string[]): Record<string, string>[] {
  const rows: Record<string, string>[] = []

  const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i)
  const searchHtml = tbodyMatch ? tbodyMatch[1] : tableHtml

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch
  let isFirstDataRow = !tableHtml.match(/<thead/i)

  while ((rowMatch = rowRegex.exec(searchHtml)) !== null) {
    if (isFirstDataRow) {
      isFirstDataRow = false
      continue
    }

    const cells = extractCells(rowMatch[1])
    if (cells.length === 0) continue

    const row: Record<string, string> = {}
    cells.forEach((value, i) => {
      const key = i < headers.length ? headers[i] : `col_${i}`
      row[key] = value
    })

    const hasContent = Object.values(row).some(v => v.length > 0)
    if (hasContent) {
      rows.push(row)
    }
  }

  return rows
}

function extractCells(rowHtml: string): string[] {
  const cells: string[] = []
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi
  let match

  while ((match = cellRegex.exec(rowHtml)) !== null) {
    cells.push(stripHtml(match[1]).trim())
  }

  return cells
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export function extractTextBetween(html: string, start: string, end: string): string | null {
  const startIdx = html.indexOf(start)
  if (startIdx === -1) return null
  const endIdx = html.indexOf(end, startIdx + start.length)
  if (endIdx === -1) return null
  return html.substring(startIdx + start.length, endIdx).trim()
}

export function extractAllTextBetween(html: string, start: string, end: string): string[] {
  const results: string[] = []
  let searchFrom = 0

  while (true) {
    const startIdx = html.indexOf(start, searchFrom)
    if (startIdx === -1) break
    const endIdx = html.indexOf(end, startIdx + start.length)
    if (endIdx === -1) break
    results.push(html.substring(startIdx + start.length, endIdx).trim())
    searchFrom = endIdx + end.length
  }

  return results
}
