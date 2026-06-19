import type { SiiCookie } from './types'

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

export function cookiesToHeader(cookies: SiiCookie[]): string {
  return cookies.map(c => `${c.name}=${c.value}`).join('; ')
}

export function cookiesToRecord(cookies: SiiCookie[]): Record<string, string> {
  return cookies.reduce((acc, c) => {
    acc[c.name] = c.value
    return acc
  }, {} as Record<string, string>)
}

export async function fetchSiiPage(
  url: string,
  cookies: SiiCookie[],
  hostname?: string
): Promise<{ html: string; status: number; headers: Headers }> {
  const headers: Record<string, string> = {
    'Cookie': cookiesToHeader(cookies),
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-CL,es;q=0.9,en;q=0.5',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  }

  if (hostname) {
    headers['Host'] = hostname
  }

  const res = await fetch(url, {
    headers,
    redirect: 'manual',
  })

  const html = await res.text()
  return { html, status: res.status, headers: res.headers }
}

export async function postSiiPage(
  url: string,
  cookies: SiiCookie[],
  body: URLSearchParams | FormData,
  hostname?: string
): Promise<{ html: string; status: number; headers: Headers }> {
  const headers: Record<string, string> = {
    'Cookie': cookiesToHeader(cookies),
    'User-Agent': USER_AGENT,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'es-CL,es;q=0.9,en;q=0.5',
  }

  if (hostname) {
    headers['Host'] = hostname
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body,
    redirect: 'manual',
  })

  const html = await res.text()
  return { html, status: res.status, headers: res.headers }
}
