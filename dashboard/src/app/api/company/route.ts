import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage/store'
import { getTokenPayload } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  const payload = await getTokenPayload(request)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const company = storage.companies.getById(payload.companyId)
  if (!company) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  return NextResponse.json({ company })
}

export async function PUT(request: NextRequest) {
  const payload = await getTokenPayload(request)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const updated = storage.companies.update(payload.companyId, body)
  if (!updated) return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })

  return NextResponse.json({ company: updated })
}
