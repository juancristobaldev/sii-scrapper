import { NextRequest, NextResponse } from 'next/server'
import { runFullDiagnosis } from '@/lib/analyzers'
import { storage } from '@/lib/storage/store'
import { getTokenPayload } from '@/lib/auth/jwt'
import type { SIIExtractedData, DiagnosticoResumen } from '@shared/types/diagnostic'
import type { AuditFinding, Alert } from '@shared/types/entities'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { data, sessionId } = body

    if (!data) {
      return NextResponse.json({ error: 'No se enviaron datos para analizar' }, { status: 400 })
    }

    const sid = sessionId || uuidv4()
    const diagnosis: DiagnosticoResumen = runFullDiagnosis(data as SIIExtractedData, sid)

    const tokenPayload = await getTokenPayload(req)
    if (tokenPayload) {
      const companyId = tokenPayload.companyId
      const userId = tokenPayload.sub

      const existingSession = storage.sessions.getById(sid)
      
      if (existingSession) {
        const findings: AuditFinding[] = diagnosis.items.map(item => ({
          id: uuidv4(),
          sessionId: sid,
          category: mapCategory(item.categoria),
          severity: item.severidad as any,
          title: item.titulo,
          description: item.descripcion,
          evidence: (item.evidencia || {}) as Record<string, unknown>,
          amount: item.impactoEstimado,
          status: 'open',
          recommendation: item.recomendacion,
          createdAt: new Date().toISOString(),
        }))

        storage.sessions.update(sid, {
          status: 'completed',
          score: diagnosis.scoreSalud,
          findings,
          completedAt: new Date().toISOString(),
        })

        findings
          .filter(f => f.severity === 'CRITICA' || f.severity === 'ALTA')
          .forEach(f => {
            const alert: Omit<Alert, 'id' | 'createdAt'> = {
              companyId,
              sessionId: sid,
              findingId: f.id,
              severity: f.severity,
              title: f.title,
              amount: f.amount,
              riskScore: f.severity === 'CRITICA' ? 90 : 70,
              area: f.category.replace(/_/g, ' '),
              origin: 'Motor de Auditoria',
              summary: f.description.substring(0, 200),
              status: 'active',
            }
            storage.alerts.create(alert)
          })
      } else {
        storage.sessions.create({
          companyId,
          userId,
          status: 'completed',
          score: diagnosis.scoreSalud,
          findings: diagnosis.items.map(item => ({
            id: uuidv4(),
            sessionId: sid,
            category: mapCategory(item.categoria),
            severity: item.severidad as any,
            title: item.titulo,
            description: item.descripcion,
            evidence: (item.evidencia || {}) as Record<string, unknown>,
            amount: item.impactoEstimado,
            status: 'open',
            recommendation: item.recomendacion,
            createdAt: new Date().toISOString(),
          })),
          extractedData: data,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        })
      }
    }

    return NextResponse.json({
      success: true,
      diagnosis,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json({ error: 'Error al ejecutar el diagnostico' }, { status: 500 })
  }
}

function mapCategory(cat: string): any {
  const mapping: Record<string, string> = {
    FUGA_DINERO: 'FUGA_DINERO',
    PAGO_DUPLICADO: 'DUPLICIDAD_PAGOS',
    INCONSISTENCIA_CONTABLE: 'INCONSISTENCIA_CONTABLE',
    ERROR_IVA: 'ERROR_IVA',
    DOCUMENTO_FALTANTE: 'DOCUMENTO_FALTANTE',
    ANOMALIA_MONTO: 'ANOMALIA_MONTO',
    RIESGO_TRIBUTARIO: 'RIESGO_TRIBUTARIO',
    FACTURACION_ELECTRONICA: 'FACTURACION_ELECTRONICA',
    INCUMPLIMIENTO_FORMAL: 'INCUMPLIMIENTO_FORMAL',
    ALERTA_F29: 'ALERTA_F29',
  }
  return mapping[cat] || cat
}
