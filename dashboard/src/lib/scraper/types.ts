export interface SiiCookie {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  sameSite: string
}

export interface SyncRequest {
  cookies: SiiCookie[]
  currentUrl?: string
}

export interface ExtractedTable {
  headers: string[]
  rows: Record<string, string>[]
  elementId?: string
  elementClass?: string
}

export interface ScrapedPage {
  url: string
  status: number
  pageType: string | null
  tables: ExtractedTable[]
  authenticated: boolean
  error?: string
}

export interface ScrapedData {
  rcv: Record<string, string>[]
  dteEmitidos: Record<string, string>[]
  dteRecibidos: Record<string, string>[]
  f29: Record<string, string>[]
  situacionTributaria: Record<string, unknown> | null
  boletas: Record<string, string>[]
  facturacionElectronica: Record<string, string>[]
  librosElectronicos: Record<string, string>[]
}

export interface SyncResult {
  success: boolean
  sessionId?: string
  data?: ScrapedData
  pagesScraped?: string[]
  error?: string
}
