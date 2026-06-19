import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import type { SyncRequest, SyncResult } from '@/lib/scraper/types'
import { scrapeWithCookies, storeCookiesForUser } from '@/lib/scraper/index'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_APP_SECRET || 'sii-scrapper-jwt-secret-change-in-production'
)

function extractToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  return req.cookies.get('token')?.value || null
}

let syncStore = new Map<string, { status: string; result?: SyncResult; startedAt: string }>()

export async function POST(req: NextRequest) {
  try {
    const token = extractToken(req)
    if (!token) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    let payload
    try {
      const verified = await jwtVerify(token, JWT_SECRET)
      payload = verified.payload as { sub: string; email: string; name: string; companyId: string }
    } catch {
      return NextResponse.json({ error: 'Token invalido o expirado' }, { status: 401 })
    }

    const body: SyncRequest = await req.json()

    if (!body.cookies || !Array.isArray(body.cookies) || body.cookies.length === 0) {
      return NextResponse.json({ error: 'No se recibieron cookies del SII' }, { status: 400 })
    }

    storeCookiesForUser(payload.sub, body.cookies)

    const sessionId = `sync-${Date.now()}-${payload.sub.slice(0, 8)}`
    syncStore.set(sessionId, { status: 'in_progress', startedAt: new Date().toISOString() })

    let result: SyncResult
    try {
      result = await scrapeWithCookies(body.cookies, body.currentUrl)
    } catch (err) {
      result = {
        success: false,
        error: err instanceof Error ? err.message : 'Error al scrapear SII',
      }
    }

    syncStore.set(sessionId, { status: result.success ? 'completed' : 'failed', result, startedAt: new Date().toISOString() })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        sessionId,
        error: result.error || 'No se pudo extraer datos del SII',
        hint: 'Asegurate de haber iniciado sesion en sii.cl antes de sincronizar.',
      })
    }

    return NextResponse.json({
      success: true,
      sessionId,
      data: result.data,
      pagesScraped: result.pagesScraped,
    })
  } catch (error) {
    console.error('SII Sync POST error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const token = extractToken(req)
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  let payload
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    payload = verified.payload as { sub: string }
  } catch {
    return NextResponse.json({ error: 'Token invalido' }, { status: 401 })
  }

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')

  if (sessionId) {
    const session = syncStore.get(sessionId)
    if (!session) {
      return NextResponse.json({ error: 'Sesion no encontrada' }, { status: 404 })
    }
    return NextResponse.json({
      sessionId,
      status: session.status,
      result: session.result,
      startedAt: session.startedAt,
    })
  }

  const activeSessions = Array.from(syncStore.entries())
    .filter(([_, s]) => s.status === 'in_progress')
    .map(([id, s]) => ({ sessionId: id, startedAt: s.startedAt }))

  return NextResponse.json({
    activeSessions,
    hasStoredCookies: false,
  })
}

export const dynamic = 'force-dynamic'
