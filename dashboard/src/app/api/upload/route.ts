import { NextRequest, NextResponse } from 'next/server'
import { parseUploadedData, type DataSection } from '@/lib/parsers'

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      return handleFormUpload(req)
    }

    return handleJsonUpload(req)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al procesar datos' }, { status: 500 })
  }
}

async function handleFormUpload(req: NextRequest) {
  const formData = await req.formData()
  const files: Record<string, string> = {}

  const sections: DataSection[] = ['rcv', 'dteEmitidos', 'dteRecibidos', 'f29']
  
  for (const section of sections) {
    const file = formData.get(section) as File | null
    if (file && file.size > 0) {
      const text = await file.text()
      files[section] = text
    }
  }

  if (Object.keys(files).length === 0) {
    return NextResponse.json({ error: 'No se subieron archivos' }, { status: 400 })
  }

  const parsed = parseUploadedData(files as Record<DataSection, string>)

  return NextResponse.json({
    success: true,
    data: {
      ...parsed,
      countRcv: (parsed.rcv || []).length,
      countDteEmitidos: (parsed.dteEmitidos || []).length,
      countDteRecibidos: (parsed.dteRecibidos || []).length,
      countF29: (parsed.f29 || []).length,
    },
  })
}

async function handleJsonUpload(req: NextRequest) {
  const body = await req.json()

  if (!body.data) {
    return NextResponse.json({ error: 'No se recibieron datos' }, { status: 400 })
  }

  const { data } = body

  const counts = {
    rcv: data.rcv?.length || 0,
    dteEmitidos: data.dteEmitidos?.length || 0,
    dteRecibidos: data.dteRecibidos?.length || 0,
    f29: data.f29?.length || 0,
    boletas: data.boletas?.length || 0,
    facturacionElectronica: data.facturacionElectronica?.length || 0,
    librosElectronicos: data.librosElectronicos?.length || 0,
    situacionTributaria: data.situacionTributaria ? 1 : 0,
  }

  return NextResponse.json({
    success: true,
    data,
    counts,
  })
}
