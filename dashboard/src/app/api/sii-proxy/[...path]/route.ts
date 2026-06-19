import { NextRequest, NextResponse } from 'next/server'
import {
  parseProxyPath,
  STRIP_HEADERS,
  rewriteHtml,
  injectExtractorScript,
  isHtmlContent,
  getContentType,
} from '@/lib/proxy/rewriter'

const SNIFF_HTML_PATTERNS = [/^\s*<!DOCTYPE\s+html/i, /^\s*<html/i, /^\s*<head/i, /^\s*<meta/i, /^\s*<title/i]
const SNIFF_BYTES = 512

function looksLikeHtml(text: string): boolean {
  return SNIFF_HTML_PATTERNS.some(p => p.test(text))
}

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params.path)
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params.path)
}

export const dynamic = 'force-dynamic'

async function handleProxy(req: NextRequest, pathParts: string[]) {
  try {
    const url = new URL(req.url)
    const { targetUrl, hostname } = parseProxyPath(pathParts, url)

    const headers = new Headers()
    for (const [key, value] of req.headers.entries()) {
      const lower = key.toLowerCase()
      const skipHeaders = [
        'host', 'origin', 'referer', 'content-length', 'transfer-encoding',
        'if-none-match', 'if-modified-since',
      ]
      if (!skipHeaders.includes(lower)) {
        headers.set(key, value)
      }
    }
    headers.set('Host', hostname)

    let body: BodyInit | null = null
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type') || ''
      const cloned = req.clone()
      if (contentType.includes('application/x-www-form-urlencoded') || 
          contentType.includes('multipart/form-data')) {
        body = await cloned.formData()
      } else {
        body = await cloned.text()
      }
    }

    const fetchHeaders: Record<string, string> = {}
    headers.forEach((value, key) => { fetchHeaders[key] = value })

    const proxyRes = await fetch(targetUrl, {
      method: req.method,
      headers: fetchHeaders,
      body: body as BodyInit | null,
      redirect: 'manual',
    })

    const responseHeaders = new Headers()

    for (const [key, value] of proxyRes.headers.entries()) {
      const lower = key.toLowerCase()

      if (STRIP_HEADERS.some(h => lower === h)) {
        continue
      }

      if (lower === 'set-cookie') {
        const cookies = value.split(',')
          .map(c => c.replace(/domain=\.?sii\.cl/gi, '').replace(/secure/gi, '').trim())
          .filter(c => c.length > 0)
        for (const c of cookies) {
          responseHeaders.append('Set-Cookie', c)
        }
        continue
      }

      if (lower === 'location') {
        let loc = value
        const siiUrlMatch = loc.match(/https?:\/\/([\w.-]*\.)?sii\.cl(.+)/i)
        if (siiUrlMatch) {
          const locHost = siiUrlMatch[1] ? siiUrlMatch[1].replace(/\.$/, '') : 'www.sii.cl'
          const rest = siiUrlMatch[2] || '/'
          loc = `/api/sii-proxy/${locHost}${rest}`
        } else if (loc.startsWith('/') && !loc.startsWith('/api/')) {
          loc = `/api/sii-proxy/${hostname}${loc}`
        }
        responseHeaders.set('Location', loc)
        continue
      }

      responseHeaders.set(key, value)
    }

    const incomingType = getContentType(proxyRes.headers)
    const hasContentType = incomingType !== ''
    const isHtml = isHtmlContent(incomingType)
    const isRedirect = proxyRes.status >= 300 && proxyRes.status < 400

    if (isHtml) {
      let html = await proxyRes.text()
      html = rewriteHtml(html, hostname)
      html = injectExtractorScript(html)
      const respHeaders = new Headers(responseHeaders)
      if (!respHeaders.has('content-type')) {
        respHeaders.set('content-type', 'text/html; charset=utf-8')
      }
      return new NextResponse(html, {
        status: proxyRes.status,
        headers: respHeaders,
      })
    }

    if (isRedirect) {
      return new NextResponse(null, {
        status: proxyRes.status,
        headers: responseHeaders,
      })
    }

    const cloned = proxyRes.clone()
    const bodyPreview = await cloned.text()
    const sniffedHtml = looksLikeHtml(bodyPreview)

    if (sniffedHtml) {
      let html = rewriteHtml(bodyPreview, hostname)
      html = injectExtractorScript(html)
      const respHeaders = new Headers(responseHeaders)
      respHeaders.set('content-type', 'text/html; charset=utf-8')
      return new NextResponse(html, {
        status: proxyRes.status,
        headers: respHeaders,
      })
    }

    const buffer = await proxyRes.arrayBuffer()
    const respHeaders = new Headers(responseHeaders)
    if (!hasContentType && buffer.byteLength > 0) {
      respHeaders.set('content-type', 'application/octet-stream')
    }
    return new NextResponse(buffer, {
      status: proxyRes.status,
      headers: respHeaders,
    })
  } catch (error) {
    console.error('Proxy error:', error)
    return NextResponse.json({ error: 'Proxy error' }, { status: 502 })
  }
}
