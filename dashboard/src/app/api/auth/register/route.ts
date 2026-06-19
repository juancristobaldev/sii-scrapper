import { NextResponse } from 'next/server'
import { storage } from '@/lib/storage/store'
import { hashPassword, generateUUID } from '@/lib/security/crypto'
import { createToken, createRefreshToken } from '@/lib/auth/jwt'
import { validateRut } from '@/lib/utils/cn'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, rutEmpresa, razonSocial, recibeEfectivo, sistemaRegistroInicial, sistemaRebaja } = body

    if (!email || !password || !name || !rutEmpresa || !razonSocial) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres' }, { status: 400 })
    }

    const cleanedRut = rutEmpresa.replace(/[^0-9kK]/g, '')
    if (!validateRut(cleanedRut)) {
      return NextResponse.json({ error: 'RUT de empresa inválido' }, { status: 400 })
    }

    const existingUser = storage.users.getByEmail(email)
    if (existingUser) {
      return NextResponse.json({ error: 'El email ya está registrado' }, { status: 409 })
    }

    let company = storage.companies.getByRut(cleanedRut)
    if (!company) {
      company = storage.companies.create({
        rut: cleanedRut,
        razonSocial,
        config: {
          recibeEfectivo: recibeEfectivo || false,
          sistemaRegistroInicial: sistemaRegistroInicial || '',
          sistemaRebaja: sistemaRebaja || '',
          flujoDinero: [],
        },
        integraciones: {
          erp: null,
          crm: null,
          bancos: [],
          sii: null,
          pos: null,
          inventario: null,
        },
      })
    }

    const user = storage.users.create({
      email: email.toLowerCase(),
      passwordHash: hashPassword(password),
      name,
      role: 'admin',
      companyId: company.id,
      mfaEnabled: false,
    })

    const token = await createToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      companyId: user.companyId,
    })

    const refreshToken = await createRefreshToken(user.id)

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
      company: {
        id: company.id,
        rut: company.rut,
        razonSocial: company.razonSocial,
      },
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
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
