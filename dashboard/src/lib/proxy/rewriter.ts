import { NextRequest } from 'next/server'

const SII_DOMAINS = [
  'zeusr.sii.cl',
  'www.sii.cl',
  'www2.sii.cl',
  'www3.sii.cl',
  'www4.sii.cl',
  'homer.sii.cl',
  'misiir.sii.cl',
  'loa.sii.cl',
]

export const STRIP_HEADERS = [
  'x-frame-options',
  'content-security-policy',
  'content-security-policy-report-only',
  'x-content-type-options',
  'x-xss-protection',
]

const INJECT_HEADERS = [
  'content-type',
  'set-cookie',
  'location',
  'cache-control',
  'expires',
  'pragma',
  'last-modified',
  'etag',
]

export interface ProxyConfig {
  hostname: string
  path: string
  search: string
  targetUrl: string
}

export function parseProxyPath(pathParts: string[], reqUrl: URL): ProxyConfig {
  let hostname = 'zeusr.sii.cl'
  let pathStart = 0

  if (pathParts.length > 0) {
    const maybeHost = pathParts[0].toLowerCase()
    if (SII_DOMAINS.some(d => maybeHost.includes(d) || maybeHost.endsWith('.sii.cl'))) {
      hostname = pathParts[0]
      pathStart = 1
    }
  }

  const remainingPath = pathParts.slice(pathStart).join('/')
  const rawSearch = reqUrl.search.slice(1)
  const path = remainingPath ? `/${remainingPath}` : '/'
  const targetUrl = `https://${hostname}${path}${rawSearch ? `?${rawSearch}` : ''}`

  return { hostname, path: path + (rawSearch ? `?${rawSearch}` : ''), search: rawSearch ? `?${rawSearch}` : '', targetUrl }
}

export function shouldForwardHeader(name: string): boolean {
  const lower = name.toLowerCase()
  return INJECT_HEADERS.some(h => lower.includes(h)) || 
         lower.startsWith('x-') ||
         lower.includes('cookie') ||
         lower.includes('auth')
}

export function rewriteHtml(html: string, hostname: string): string {
  const proxyBase = `/api/sii-proxy/${hostname}`

  let rewritten = html

  rewritten = rewritten.replace(
    /(href|src|action|data-src|data-url)\s*=\s*["'](https?:)?\/\/([\w.-]*\.)?sii\.cl([^"'\s]*)["']/gi,
    (_match, attr, _proto, _sub, rest) => {
      let fullPath = rest
      if (fullPath.startsWith('//')) fullPath = fullPath.slice(1)
      return `${attr}="${proxyBase}${fullPath}"`
    }
  )

  rewritten = rewritten.replace(
    /(href|src|action|data-src|data-url)\s*=\s*["']https?:\/\/([\w.-]*\.)?sii\.cl([^"'\s]*)["']/gi,
    (_match, attr, _proto, _sub, rest) => {
      let fullPath = rest
      if (fullPath.startsWith('//')) fullPath = fullPath.slice(1)
      return `${attr}="${proxyBase}${fullPath}"`
    }
  )

  rewritten = rewritten.replace(
    /(location\.(href|replace|assign)\s*[=(]\s*["'])\s*https?:\/\/([\w.-]*\.)?sii\.cl([^"'\s]*)(["'])/gi,
    (_match, prefix, _method, _sub, rest, suffix) => {
      let fullPath = rest
      if (fullPath.startsWith('//')) fullPath = fullPath.slice(1)
      return `${prefix}${proxyBase}${fullPath}${suffix}`
    }
  )

  rewritten = rewritten.replace(
    /(\.open\s*\(\s*["']\s*(?:GET|POST|PUT|DELETE|PATCH)?\s*["']?\s*,\s*["'])\s*https?:\/\/([\w.-]*\.)?sii\.cl([^"'\s]*)(["'])/gi,
    (_match, prefix, _sub, rest, suffix) => {
      let fullPath = rest
      if (fullPath.startsWith('//')) fullPath = fullPath.slice(1)
      return `${prefix}${proxyBase}${fullPath}${suffix}`
    }
  )

  return rewritten
}

export function injectExtractorScript(html: string): string {
  const scriptTag = `
<script>
(function() {
  if (window.__SII_SCRAPPER_INJECTED__) return
  window.__SII_SCRAPPER_INJECTED__ = true

  var extractor = {
    pendingExtractions: {},
    
    detectPage: function() {
      var url = window.location.href.toLowerCase()
      var text = document.body.textContent.toLowerCase()
      
      if (url.includes('rcv') || text.includes('registro de compras') || text.includes('compras y ventas')) return 'rcv'
      if ((url.includes('dte') || text.includes('documento tributario')) && (text.includes('emitido') || url.includes('emitido'))) return 'dte-emitidos'
      if ((url.includes('dte') || text.includes('documento tributario')) && (text.includes('recibido') || url.includes('recibido'))) return 'dte-recibidos'
      if (url.includes('f29') || text.includes('declaracion mensual') || text.includes('formulario 29')) return 'f29'
      if (url.includes('situacion') || text.includes('situacion tributaria')) return 'situacion'
      if (url.includes('boleta') || text.includes('boletas emitidas')) return 'boletas'
      if (url.includes('factura') && (text.includes('electronica') || text.includes('timbrado'))) return 'facturacion'
      if (url.includes('libro') && (text.includes('electronico') || text.includes('contable'))) return 'libros'
      return null
    },

    extractTables: function() {
      var tables = document.querySelectorAll('table')
      if (tables.length === 0) return []
      
      var items = []
      
      for (var t = 0; t < tables.length; t++) {
        var table = tables[t]
        var rows = table.querySelectorAll('tr')
        if (rows.length < 2) continue
        
        var headers = []
        var headerRow = rows[0]
        if (headerRow) {
          var cells = headerRow.querySelectorAll('th, td')
          for (var c = 0; c < cells.length; c++) {
            headers.push(cells[c].textContent.trim().toLowerCase().replace(/\\s+/g, ' '))
          }
        }
        
        for (var i = 1; i < rows.length; i++) {
          var cols = rows[i].querySelectorAll('td')
          if (cols.length === 0) continue
          
          var row = {}
          for (var j = 0; j < cols.length; j++) {
            var key = headers[j] || ('col_' + j)
            row[key] = cols[j].textContent.trim()
          }
          items.push(row)
        }
      }
      
      return items
    },

    extract: function() {
      var pageType = this.detectPage()
      var tables = this.extractTables()
      
      if (tables.length === 0 || !pageType) return
      
      var key = pageType + '_' + Date.now()
      if (this.pendingExtractions[pageType] && 
          this.pendingExtractions[pageType].count === tables.length) {
        return
      }
      
      this.pendingExtractions[pageType] = { count: tables.length, time: Date.now() }
      
      window.parent.postMessage({
        source: 'sii-scrapper-extractor',
        type: 'extracted',
        pageType: pageType,
        data: tables,
        count: tables.length,
        url: window.location.href,
      }, '*')
      
      this.showNotification(pageType, tables.length)
    },

    showNotification: function(type, count) {
      var el = document.getElementById('__sii_scrapper_badge__')
      if (!el) {
        el = document.createElement('div')
        el.id = '__sii_scrapper_badge__'
        el.style.cssText = 'position:fixed;top:10px;right:10px;z-index:999999;' +
          'background:#059669;color:white;padding:8px 16px;border-radius:8px;' +
          'font-family:system-ui,sans-serif;font-size:13px;font-weight:600;' +
          'box-shadow:0 4px 12px rgba(0,0,0,0.3);animation:fadeIn 0.3s ease;pointer-events:none;'
        document.body.appendChild(el)
      }
      
      var labels = {
        'rcv': 'RCV',
        'dte-emitidos': 'DTE Emitidos',
        'dte-recibidos': 'DTE Recibidos',
        'f29': 'F29',
        'situacion': 'Situacion Tributaria',
        'boletas': 'Boletas',
        'facturacion': 'Facturacion Electronica',
        'libros': 'Libros Electronicos'
      }
      
      el.textContent = 'Extraid ' + count + ' registros de ' + (labels[type] || type)
      el.style.opacity = '1'
      
      setTimeout(function() {
        el.style.transition = 'opacity 1s ease'
        el.style.opacity = '0'
      }, 2500)
    },

    interceptNavigation: function() {
      var self = this
      var origAssign = window.location.assign
      var origReplace = window.location.replace
      var origSetHref = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href')
      
      var proxyUrl = function(url) {
        if (!url || typeof url !== 'string') return url
        var match = url.match(/https?:\\/\\/([\\w.-]*\\.)?sii\\.cl(.*)/i)
        if (match) {
          var hostname = match[1] ? match[1].replace(/\\.$/, '') : 'www.sii.cl'
          if (!hostname.includes('sii.cl')) hostname = hostname + '.sii.cl'
          var rest = match[2] || '/'
          if (rest.startsWith('//')) rest = rest.slice(1)
          return '/api/sii-proxy/' + hostname + rest
        }
        return url
      }
      
      try {
        if (origSetHref && origSetHref.set) {
          Object.defineProperty(window.location, 'href', {
            get: function() { return origSetHref.get.call(window.location) },
            set: function(val) { origSetHref.set.call(window.location, proxyUrl(val)) },
            configurable: true
          })
        }
      } catch(e) {}

      window.location.assign = function(url) { return origAssign.call(window.location, proxyUrl(url)) }
      window.location.replace = function(url) { return origReplace.call(window.location, proxyUrl(url)) }
    }
  }

  extractor.interceptNavigation()

  var checkInterval = setInterval(function() {
    var pageType = extractor.detectPage()
    if (pageType) {
      extractor.extract()
    }
  }, 2000)

  extractor.extract()
})()
</script>`

  if (html.includes('</body>')) {
    return html.replace('</body>', scriptTag + '\n</body>')
  }
  return html + scriptTag
}

export function getContentType(headers: Headers): string {
  return headers.get('content-type') || ''
}

export function isHtmlContent(contentType: string): boolean {
  return contentType.includes('text/html') || contentType.includes('application/xhtml')
}
