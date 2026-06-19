import { NextRequest, NextResponse } from 'next/server'
import { getTokenPayload } from '@/lib/auth/jwt'
import { generateReportHTML } from '@/lib/reports/pdf-generator'

export async function POST(request: NextRequest) {
  try {
    const payload = await getTokenPayload(request)
    if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

    const body = await request.json()
    const { diagnosis, companyName, companyRut } = body

    if (!diagnosis) {
      return NextResponse.json({ error: 'No se enviaron datos de diagnostico' }, { status: 400 })
    }

    const html = generateReportHTML(diagnosis, {
      companyName: companyName || 'Empresa',
      companyRut: companyRut || '',
      generatedBy: payload.name,
      generatedAt: new Date().toISOString(),
    })

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="informe-auditoria-${new Date().toISOString().split('T')[0]}.html"`,
      },
    })
  } catch (error) {
    console.error('PDF report error:', error)
    return NextResponse.json({ error: 'Error al generar el informe' }, { status: 500 })
  }
}
