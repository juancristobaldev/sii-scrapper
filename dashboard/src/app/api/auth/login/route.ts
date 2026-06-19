import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage/store'
import { verifyPassword } from '@/lib/security/crypto'
import { createToken, createRefreshToken } from '@/lib/auth/jwt'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, mfaToken } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email y contraseña requeridos' }, { status: 400 })
    }

    const user = storage.users.getByEmail(email.toLowerCase())
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valid = verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (user.mfaEnabled) {
      if (!mfaToken) {
        return NextResponse.json({
          mfaRequired: true,
          userId: user.id,
        }, { status: 200 })
      }
      return NextResponse.json({ error: 'MFA no implementado. Contacta al administrador.' }, { status: 400 })
    }

    storage.users.update(user.id, { lastLogin: new Date().toISOString() })

    const token = await createToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    })

    const refreshToken = await createRefreshToken(user.id)

    const company = storage.companies.getById(user.companyId)

    const response = NextResponse.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
      },
      company: company ? {
        id: company.id,
        rut: company.rut,
        razonSocial: company.razonSocial,
      } : null,
    })

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
