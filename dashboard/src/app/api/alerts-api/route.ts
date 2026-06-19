import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage/store'
import { getTokenPayload } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  const payload = await getTokenPayload(request)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const alerts = storage.alerts.listByCompany(payload.companyId)
  return NextResponse.json({ alerts })
}

export async function PUT(request: NextRequest) {
  const payload = await getTokenPayload(request)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const { id, ...data } = body
  const updated = storage.alerts.update(id, data)
  if (!updated) return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 })

  return NextResponse.json({ alert: updated })
}
