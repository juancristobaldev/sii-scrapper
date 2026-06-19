import { NextRequest, NextResponse } from 'next/server'
import { storage } from '@/lib/storage/store'
import { getTokenPayload } from '@/lib/auth/jwt'

export async function GET(request: NextRequest) {
  const payload = await getTokenPayload(request)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const sessions = storage.sessions.listByCompany(payload.companyId)
  return NextResponse.json({ sessions })
}

export async function POST(request: NextRequest) {
  const payload = await getTokenPayload(request)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json()
  const session = storage.sessions.create({
    companyId: payload.companyId,
    userId: payload.sub,
    status: 'running',
    score: 0,
    findings: [],
    startedAt: new Date().toISOString(),
  })

  return NextResponse.json({ session })
}
