import fs from 'fs'
import path from 'path'
import type { SiiCookie, SyncResult, ScrapedData, ScrapedPage } from './types'
import { fetchSiiPage } from './sii-client'
import { extractTables } from './table-parser'
import { detectPageType, detectAuthenticated, extractRutFromPage } from './page-detector'
import { encrypt, decrypt } from '../security/crypto'

export async function scrapeWithCookies(
  cookies: SiiCookie[],
  currentUrl?: string
): Promise<SyncResult> {
  const scrapedPages: string[] = []
  const errors: string[] = []

  const result: ScrapedData = {
    rcv: [],
    dteEmitidos: [],
    dteRecibidos: [],
    f29: [],
    situacionTributaria: null,
    boletas: [],
    facturacionElectronica: [],
    librosElectronicos: [],
  }

  if (currentUrl) {
    const page = await scrapePage(currentUrl, cookies)
    scrapedPages.push(currentUrl)

    if (page.authenticated && page.pageType) {
      mergePageData(result, page)
    } else if (!page.authenticated) {
      return {
        success: false,
        error: 'Las cookies de sesion del SII expiraron o no son validas. Vuelve a iniciar sesion en sii.cl.',
      }
    }
  }

  const serviceUrls = buildServiceUrls(cookies, currentUrl)

  for (const [section, url] of Object.entries(serviceUrls)) {
    if (!url) continue

    try {
      const page = await scrapePage(url, cookies)
      scrapedPages.push(url)

      if (page.authenticated) {
        if (page.pageType) {
          mergePageData(result, page)
        } else if (page.tables.length > 0) {
          mergeTablesToSection(result, section, page.tables)
        }
      }
    } catch (err) {
      errors.push(`${section}: ${err instanceof Error ? err.message : 'Error desconocido'}`)
    }
  }

  const hasData = Object.values(result).some(v => {
    if (Array.isArray(v)) return v.length > 0
    return v !== null
  })

  if (!hasData && errors.length > 0) {
    return {
      success: false,
      error: `No se pudo extraer datos. Errores: ${errors.join('; ')}`,
    }
  }

  return {
    success: true,
    data: result,
    pagesScraped: scrapedPages,
  }
}

async function scrapePage(url: string, cookies: SiiCookie[]): Promise<ScrapedPage> {
  const { html, status } = await fetchSiiPage(url, cookies)
  const authenticated = detectAuthenticated(html)
  const pageType = detectPageType(html, url)
  const tables = extractTables(html)

  return { url, status, pageType, tables, authenticated }
}

function mergePageData(result: ScrapedData, page: ScrapedPage): void {
  if (!page.pageType) return

  const allRows = page.tables.flatMap(t => t.rows)

  switch (page.pageType) {
    case 'rcv':
      if (allRows.length > 0) result.rcv = allRows
      break
    case 'dte-emitidos':
      if (allRows.length > 0) result.dteEmitidos = allRows
      break
    case 'dte-recibidos':
      if (allRows.length > 0) result.dteRecibidos = allRows
      break
    case 'f29':
      if (allRows.length > 0) result.f29 = allRows
      break
    case 'boletas':
      if (allRows.length > 0) result.boletas = allRows
      break
    case 'facturacion':
      if (allRows.length > 0) result.facturacionElectronica = allRows
      break
    case 'libros':
      if (allRows.length > 0) result.librosElectronicos = allRows
      break
    case 'situacion': {
      const rut = extractRutFromPage(page.tables[0]?.rows[0]?.[''] || '')
      result.situacionTributaria = { rut, tables: page.tables }
      break
    }
  }
}

function mergeTablesToSection(
  result: ScrapedData,
  section: string,
  tables: import('./types').ExtractedTable[]
): void {
  const allRows = tables.flatMap(t => t.rows)
  if (allRows.length === 0) return

  switch (section) {
    case 'rcv':
      result.rcv = allRows
      break
    case 'dteEmitidos':
      result.dteEmitidos = allRows
      break
    case 'dteRecibidos':
      result.dteRecibidos = allRows
      break
    case 'f29':
      result.f29 = allRows
      break
    case 'boletas':
      result.boletas = allRows
      break
    case 'facturacion':
      result.facturacionElectronica = allRows
      break
    case 'libros':
      result.librosElectronicos = allRows
      break
  }
}

function buildServiceUrls(
  cookies: SiiCookie[],
  currentUrl?: string
): Record<string, string | null> {
  const host = extractHostFromCookies(cookies) || 'zeusr.sii.cl'

  return {
    rcv: `https://${host}/AUT2000/InicioAutenticacion/IngresoRutClave.html`,
    dteEmitidos: null,
    dteRecibidos: null,
    f29: null,
    boletas: null,
    facturacion: null,
    libros: null,
    situacion: null,
  }
}

function extractHostFromCookies(cookies: SiiCookie[]): string | null {
  const siiCookie = cookies.find(c =>
    c.domain.includes('zeusr.sii.cl') ||
    c.domain.includes('sii.cl') && !c.domain.startsWith('.')
  )
  if (siiCookie) {
    return siiCookie.domain.replace(/^\./, '')
  }
  return null
}

export function storeCookiesForUser(userId: string, cookies: SiiCookie[]): void {
  try {
    const dir = path.join(process.cwd(), 'data', 'sii-sessions')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const payload = {
      userId,
      cookies,
      storedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
    }

    const encryptedData = encrypt(JSON.stringify(payload))
    fs.writeFileSync(path.join(dir, `${userId}.enc`), encryptedData, 'utf-8')
  } catch {
    console.error('Failed to store SII cookies for user:', userId)
  }
}

export function getStoredCookies(userId: string): SiiCookie[] | null {
  try {
    const filePath = path.join(process.cwd(), 'data', 'sii-sessions', `${userId}.enc`)
    if (!fs.existsSync(filePath)) return null

    const encryptedData = fs.readFileSync(filePath, 'utf-8')
    const decrypted = decrypt(encryptedData)
    const payload = JSON.parse(decrypted)

    if (new Date(payload.expiresAt) < new Date()) {
      fs.unlinkSync(filePath)
      return null
    }

    return payload.cookies
  } catch {
    return null
  }
}
