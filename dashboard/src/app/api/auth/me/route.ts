import { NextResponse } from 'next/server'
import { getTokenPayload } from '@/lib/auth/jwt'
import { storage } from '@/lib/storage/store'

export async function GET(request: Request) {
  try {
    const payload = await getTokenPayload(request)
    if (!payload) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const user = storage.users.getById(payload.sub)
    if (!user) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
    }

    const company = storage.companies.getById(user.companyId)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        mfaEnabled: user.mfaEnabled,
      },
      company: company ? {
        id: company.id,
        rut: company.rut,
        razonSocial: company.razonSocial,
        config: company.config,
        integraciones: {
          erp: company.integraciones.erp?.enabled || false,
          crm: company.integraciones.crm?.enabled || false,
          bancos: company.integraciones.bancos.filter(b => b.enabled).length,
          sii: company.integraciones.sii?.enabled || false,
        },
      } : null,
    })
  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
