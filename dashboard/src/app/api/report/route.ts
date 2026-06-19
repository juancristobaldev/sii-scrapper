import { NextRequest, NextResponse } from 'next/server'
import { runFullDiagnosis } from '@/lib/analyzers'
import type { SIIExtractedData } from '@shared/types/diagnostic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data } = body

    if (!data) {
      return NextResponse.json({ error: 'No se enviaron datos' }, { status: 400 })
    }

    const diagnosis = runFullDiagnosis(data as SIIExtractedData, 'report')

    const report = generateReport(diagnosis)

    return NextResponse.json({
      success: true,
      report,
    })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}

function generateReport(diagnosis: any): string {
  const lines: string[] = [
    '=== INFORME DE DIAGNOSTICO TRIBUTARIO ===',
    `Fecha: ${new Date(diagnosis.fechaAnalisis).toLocaleDateString('es-CL')}`,
    `Score de Salud Contable: ${diagnosis.scoreSalud}/100`,
    `Total Hallazgos: ${diagnosis.totalHallazgos}`,
    `Fugas de Dinero Detectadas: $${diagnosis.fugasDineroTotal.toLocaleString('es-CL')}`,
    `Riesgo Fiscal: $${diagnosis.riesgoFiscal.toLocaleString('es-CL')}`,
    '',
    `--- Distribucion ---`,
    `Criticas: ${diagnosis.distribucion.CRITICA || 0}`,
    `Altas: ${diagnosis.distribucion.ALTA || 0}`,
    `Medias: ${diagnosis.distribucion.MEDIA || 0}`,
    `Bajas: ${diagnosis.distribucion.BAJA || 0}`,
    '',
    '=== DETALLE DE HALLAZGOS ===',
    '',
  ]

  for (const item of diagnosis.items) {
    lines.push(`[${item.severidad}] ${item.categoria}`)
    lines.push(`  ${item.titulo}`)
    lines.push(`  ${item.descripcion}`)
    lines.push(`  Recomendacion: ${item.recomendacion}`)
    if (item.impactoEstimado) {
      lines.push(`  Impacto estimado: $${item.impactoEstimado.toLocaleString('es-CL')}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}
