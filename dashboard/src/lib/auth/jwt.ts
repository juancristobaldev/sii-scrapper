import { SignJWT, jwtVerify } from 'jose'
import type { TokenPayload, UserRole } from '@shared/types/entities'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || process.env.NEXT_PUBLIC_APP_SECRET || 'sii-scrapper-jwt-secret-change-in-production'
)

const TOKEN_EXPIRY = '24h'
const REFRESH_EXPIRY = '7d'

export async function createToken(payload: {
  sub: string
  email: string
  name: string
  role: UserRole
  companyId: string
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRY)
    .sign(JWT_SECRET)
}

export async function createRefreshToken(sub: string): Promise<string> {
  return new SignJWT({ sub, type: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_EXPIRY)
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as TokenPayload
  } catch {
    return null
  }
}

export function getTokenFromHeader(headers: Headers): string | null {
  const auth = headers.get('authorization')
  if (!auth || !auth.startsWith('Bearer ')) return null
  return auth.slice(7)
}

export async function getTokenPayload(request: Request): Promise<TokenPayload | null> {
  const token = getTokenFromHeader(request.headers)
  if (!token) return null
  return verifyToken(token)
}
