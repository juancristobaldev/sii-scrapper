import type { F29Data } from '@shared/types/f29'

export function parseF29(csvContent: string): F29Data[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
  const results: F29Data[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
    if (values.length < 6) continue

    results.push({
      periodo: values[0] || '',
      rut: values[1] || '',
      razonSocial: values[2] || '',
      codigo: parseInt(values[3]) || 0,
      descripcion: values[4] || '',
      valor: parseFloat(values[5]?.replace(/\./g, '').replace(',', '.') || '0'),
      seccion: values[6] || '',
    })
  }

  return results
}
