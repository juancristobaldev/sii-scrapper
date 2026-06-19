(function() {
  'use strict'

  injectSidebar()

  function injectSidebar() {
    if (document.getElementById('sii-scrapper-sidebar')) return

    const sidebar = document.createElement('div')
    sidebar.id = 'sii-scrapper-sidebar'
    sidebar.innerHTML = getSidebarHTML()
    document.body.appendChild(sidebar)

    const toggle = document.getElementById('sii-scrapper-toggle')
    const panel = document.getElementById('sii-scrapper-panel')
    let isOpen = false

    if (toggle && panel) {
      toggle.addEventListener('click', () => {
        isOpen = !isOpen
        if (isOpen) {
          panel.style.transform = 'translateX(0)'
          toggle.style.right = '320px'
          toggle.innerHTML = '&#9654;'
        } else {
          panel.style.transform = 'translateX(100%)'
          toggle.style.right = '0'
          toggle.innerHTML = '&#9664;'
        }
      })

      document.getElementById('sii-scrapper-close')?.addEventListener('click', () => {
        isOpen = false
        panel.style.transform = 'translateX(100%)'
        toggle.style.right = '0'
        toggle.innerHTML = '&#9664;'
      })
    }

    setupExtractButtons()
  }

  function getSidebarHTML() {
    return `
      <div id="sii-scrapper-toggle" style="
        position: fixed; top: 50%; right: 0; z-index: 99999;
        width: 32px; height: 60px; background: #1a56db; color: white;
        border: none; border-radius: 6px 0 0 6px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 14px; box-shadow: -2px 0 8px rgba(0,0,0,0.3);
        transition: right 0.3s ease;
      " title="SII Scrapper">&#9664;</div>
      <div id="sii-scrapper-panel" style="
        position: fixed; top: 0; right: 0; width: 320px; height: 100vh;
        z-index: 99998; background: #0f172a; color: #f8fafc;
        transform: translateX(100%); transition: transform 0.3s ease;
        display: flex; flex-direction: column; box-shadow: -4px 0 16px rgba(0,0,0,0.4);
        font-family: system-ui, sans-serif; font-size: 13px;
      ">
        <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #1e293b;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">&#9888;</span>
            <div>
              <div style="font-weight:700;font-size:14px;">SII Scrapper</div>
              <div style="font-size:11px;color:#94a3b8;">Diagnostico Tributario</div>
            </div>
          </div>
          <button id="sii-scrapper-close" style="background:none;border:none;color:#94a3b8;cursor:pointer;font-size:18px;">&times;</button>
        </div>
        <div style="flex:1;overflow-y:auto;padding:12px;">
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">EXTRACCION DE DATOS</div>
            <button data-extract="rcv" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#128203; Extraer RCV
            </button>
            <button data-extract="dte-emitidos" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#128228; Extraer DTE Emitidos
            </button>
            <button data-extract="dte-recibidos" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#128229; Extraer DTE Recibidos
            </button>
            <button data-extract="f29" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#128196; Extraer F29
            </button>
            <button data-extract="situacion" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#129514; Extraer Situacion Tributaria
            </button>
            <button data-extract="boletas" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#128179; Extraer Boletas
            </button>
            <button data-extract="facturacion" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#9889; Extraer Facturacion Electronica
            </button>
            <button data-extract="libros" class="sii-extract-btn" style="
              width:100%;padding:8px 12px;margin-bottom:6px;background:#1e293b;color:#f8fafc;
              border:1px solid #334155;border-radius:6px;cursor:pointer;text-align:left;
              font-size:12px;transition:all 0.2s;
            " onmouseover="this.style.background='#334155'" onmouseout="this.style.background='#1e293b'">
              &#128214; Extraer Libros Electronicos
            </button>
          </div>
          <div style="margin-bottom:12px;">
            <div style="font-size:11px;color:#94a3b8;margin-bottom:8px;">ACCIONES</div>
            <button id="sii-analyze" style="
              width:100%;padding:10px 12px;margin-bottom:6px;background:#1a56db;color:white;
              border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;
              transition:all 0.2s;
            " onmouseover="this.style.background='#1e40af'" onmouseout="this.style.background='#1a56db'">
              &#128270; Analizar Todo
            </button>
            <button id="sii-send-dashboard" style="
              width:100%;padding:10px 12px;margin-bottom:6px;background:#059669;color:white;
              border:none;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;
              transition:all 0.2s;
            " onmouseover="this.style.background='#047857'" onmouseout="this.style.background='#059669'">
              &#128640; Enviar al Dashboard
            </button>
            <button id="sii-clear" style="
              width:100%;padding:8px 12px;background:transparent;color:#ef4444;
              border:1px solid #ef4444;border-radius:6px;cursor:pointer;font-size:12px;
              transition:all 0.2s;
            " onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='transparent'">
              Limpiar Datos
            </button>
          </div>
          <div id="sii-status" style="
            padding:8px;background:#1e293b;border-radius:6px;font-size:11px;color:#94a3b8;
            text-align:center;
          ">Listo para extraer datos. Navega por el SII y haz click en los botones.</div>
        </div>
        <div style="padding:8px 12px;border-top:1px solid #1e293b;font-size:10px;color:#64748b;text-align:center;">
          Tus datos se procesan localmente. No compartimos credenciales.
        </div>
      </div>
    `
  }

  function setupExtractButtons() {
    document.querySelectorAll('[data-extract]').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-extract')
        const status = document.getElementById('sii-status')
        if (status) status.textContent = `Extrayendo ${type}...`
        extractFromPage(type)
      })
    })

    document.getElementById('sii-analyze')?.addEventListener('click', async () => {
      const status = document.getElementById('sii-status')
      if (status) status.textContent = 'Analizando datos...'
      try {
        const response = await chrome.runtime.sendMessage({ type: 'ANALYZE_DATA' })
        if (response.success) {
          chrome.storage.local.set({ siiDiagnosis: response.diagnosis })
          if (status) status.innerHTML = '<span style="color:#22c55e;">Diagnostico completado. ' + response.diagnosis.totalHallazgos + ' hallazgos.</span>'
        } else {
          if (status) status.textContent = 'Error: ' + (response.error || 'desconocido')
        }
      } catch (err) {
        if (status) status.textContent = 'Error de conexion. Ejecuta el dashboard en localhost:3000'
      }
    })

    document.getElementById('sii-send-dashboard')?.addEventListener('click', async () => {
      const status = document.getElementById('sii-status')
      if (status) status.textContent = 'Enviando al dashboard...'
      try {
        const response = await chrome.runtime.sendMessage({ type: 'SEND_TO_DASHBOARD' })
        if (response.success) {
          if (status) status.innerHTML = '<span style="color:#22c55e;">Datos enviados al dashboard. Abre la app para ver resultados.</span>'
        } else {
          if (status) status.textContent = 'Error de conexion. Ejecuta el dashboard en localhost:3000'
        }
      } catch (err) {
        if (status) status.textContent = 'Error de conexion. Ejecuta el dashboard en localhost:3000'
      }
    })

    document.getElementById('sii-clear')?.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' })
      const status = document.getElementById('sii-status')
      if (status) status.textContent = 'Datos limpiados.'
    })
  }

  function extractFromPage(type) {
    const status = document.getElementById('sii-status')
    
    switch (type) {
      case 'rcv':
        extractRCV()
        break
      case 'dte-emitidos':
        extractDTE('EMITIDO')
        break
      case 'dte-recibidos':
        extractDTE('RECIBIDO')
        break
      case 'f29':
        extractF29()
        break
      case 'situacion':
        extractSituacion()
        break
      case 'boletas':
        extractBoletas()
        break
      case 'facturacion':
        extractFacturacion()
        break
      case 'libros':
        extractLibros()
        break
      default:
        if (status) status.textContent = `Extraccion de ${type} no implementada aun.`
    }
  }

  function extractTableData() {
    const tables = document.querySelectorAll('table')
    if (tables.length === 0) return []

    const targetTable = tables[tables.length > 1 ? 1 : 0]
    const rows = targetTable.querySelectorAll('tr')
    const data = []

    const headers = []
    const headerRow = rows[0]
    if (headerRow) {
      headerRow.querySelectorAll('th, td').forEach(cell => {
        headers.push(cell.textContent.trim().toLowerCase().replace(/[^a-z0-9 ]/g, ''))
      })
    }

    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td')
      if (cells.length === 0) continue

      const rowData = {}
      cells.forEach((cell, j) => {
        if (j < headers.length) {
          rowData[headers[j]] = cell.textContent.trim()
        } else {
          rowData[`col_${j}`] = cell.textContent.trim()
        }
      })
      data.push(rowData)
    }

    return data
  }

  function extractRCV() {
    const status = document.getElementById('sii-status')
    const data = extractTableData()

    if (data.length === 0) {
      if (status) status.textContent = 'No se encontro tabla de RCV. Asegurate de estar en la pagina correcta (zeusr.sii.cl).'
      return
    }

    const rcvData = data.map(row => ({
      periodo: row.periodo || '',
      tipo: (row.tipo || '').toLowerCase().includes('compra') ? 'COMPRA' : 'VENTA',
      rut: row.rut || row['rut proveedor'] || row['rut cliente'] || '',
      razonSocial: row['razon social'] || row['nombre o razon social'] || '',
      tipoDocumento: parseInt(row['tipo documento'] || row['tipo doc'] || '0'),
      folio: parseInt(row.folio || '0'),
      fecha: row.fecha || '',
      montoNeto: parseFloat((row['monto neto'] || '0').replace(/\./g, '').replace(',', '.')),
      montoIva: parseFloat((row['monto iva'] || row['iva'] || '0').replace(/\./g, '').replace(',', '.')),
      montoExento: parseFloat((row['monto exento'] || '0').replace(/\./g, '').replace(',', '.')),
      montoTotal: parseFloat((row['monto total'] || row['total'] || '0').replace(/\./g, '').replace(',', '.')),
      ivaRecuperable: parseFloat((row['iva recuperable'] || '0').replace(/\./g, '').replace(',', '.')),
    }))

    chrome.runtime.sendMessage({ type: 'EXTRACT_RCV', data: rcvData })
    if (status) status.textContent = `${rcvData.length} registros RCV extraidos.`
  }

  function extractDTE(tipo) {
    const status = document.getElementById('sii-status')
    const data = extractTableData()

    if (data.length === 0) {
      if (status) status.textContent = 'No se encontraron tablas de DTE.'
      return
    }

    const dteData = data.map(row => ({
      tipo: parseInt(row.tipo || '33'),
      folio: parseInt(row.folio || '0'),
      rutEmisor: row['rut emisor'] || '',
      razonSocialEmisor: row['razon social emisor'] || row['emisor'] || '',
      rutReceptor: row['rut receptor'] || '',
      razonSocialReceptor: row['razon social receptor'] || row['receptor'] || '',
      fechaEmision: row['fecha emision'] || row['fecha'] || '',
      fechaRecepcion: row['fecha recepcion'] || undefined,
      montoNeto: parseFloat((row['monto neto'] || '0').replace(/\./g, '').replace(',', '.')),
      montoIva: parseFloat((row['monto iva'] || '0').replace(/\./g, '').replace(',', '.')),
      montoTotal: parseFloat((row['monto total'] || row['total'] || '0').replace(/\./g, '').replace(',', '.')),
      estado: (row.estado || 'EMITIDO').toUpperCase(),
      trackId: row['track id'] || undefined,
    }))

    chrome.runtime.sendMessage({ type: 'EXTRACT_DTE', data: { tipo, items: dteData } })
    if (status) status.textContent = `${dteData.length} DTE ${tipo.toLowerCase()}s extraidos.`
  }

  function extractF29() {
    const status = document.getElementById('sii-status')
    const data = extractTableData()

    if (data.length === 0) {
      if (status) status.textContent = 'No se encontro F29. Ve a la pagina de declaraciones mensuales.'
      return
    }

    const f29Data = data.map(row => ({
      periodo: row.periodo || row['periodo tributario'] || '',
      rut: row.rut || '',
      razonSocial: row['razon social'] || row['contribuyente'] || '',
      codigo: parseInt(row.codigo || row['codigo linea'] || '0'),
      descripcion: row.descripcion || row['detalle'] || '',
      valor: parseFloat((row.valor || row.monto || '0').replace(/\./g, '').replace(',', '.')),
      seccion: row.seccion || '',
    }))

    chrome.runtime.sendMessage({ type: 'EXTRACT_F29', data: f29Data })
    if (status) status.textContent = `${f29Data.length} lineas F29 extraidas.`
  }

  function extractSituacion() {
    const status = document.getElementById('sii-status')
    
    const situacion = {
      rut: '',
      razonSocial: '',
      giro: '',
      inicioActividades: '',
      situacionActual: 'ACTIVO',
      bloqueos: [],
      anotaciones: [],
      conveniosPago: [],
    }

    const text = document.body.textContent || ''
    
    const rutMatch = text.match(/RUT[:\s]*([0-9]+-[0-9kK])/i)
    if (rutMatch) situacion.rut = rutMatch[1]

    const razonMatch = text.match(/Razon Social[:\s]*([^\n]+)/i) || text.match(/Nombre[:\s]*([^\n]+)/i)
    if (razonMatch) situacion.razonSocial = razonMatch[1].trim()

    if (text.includes('SUSPENDIDO')) situacion.situacionActual = 'SUSPENDIDO'
    else if (text.includes('INACTIVO')) situacion.situacionActual = 'INACTIVO'
    else if (text.includes('NO UBICADO')) situacion.situacionActual = 'NO_UBICADO'

    chrome.runtime.sendMessage({ type: 'EXTRACT_SITUACION', data: situacion })
    if (status) status.textContent = 'Situacion tributaria extraida.'
  }

  function extractBoletas() {
    const status = document.getElementById('sii-status')
    const data = extractTableData()

    if (data.length === 0) {
      if (status) status.textContent = 'No se encontraron boletas.'
      return
    }

    chrome.runtime.sendMessage({ type: 'EXTRACT_BOLETAS', data })
    if (status) status.textContent = `${data.length} boletas extraidas.`
  }

  function extractFacturacion() {
    const status = document.getElementById('sii-status')
    const data = extractTableData()

    if (data.length === 0) {
      if (status) status.textContent = 'No se encontro info de facturacion electronica.'
      return
    }

    chrome.runtime.sendMessage({ type: 'EXTRACT_FACTURACION', data })
    if (status) status.textContent = `${data.length} registros de FE extraidos.`
  }

  function extractLibros() {
    const status = document.getElementById('sii-status')
    const data = extractTableData()

    if (data.length === 0) {
      if (status) status.textContent = 'No se encontraron libros electronicos.'
      return
    }

    const librosData = data.map(row => ({
      periodo: row.periodo || '',
      tipoLibro: row['tipo libro'] || row.tipo || 'COMPRAS',
      rut: row.rut || '',
      estado: row.estado || 'PENDIENTE',
      fechaEnvio: row['fecha envio'] || undefined,
      fechaAceptacion: row['fecha aceptacion'] || undefined,
      observaciones: row.observaciones || undefined,
    }))

    chrome.runtime.sendMessage({ type: 'EXTRACT_LIBROS', data: librosData })
    if (status) status.textContent = `${librosData.length} libros extraidos.`
  }

  function notifyPageLoad() {
    var url = window.location.href
    var isLogin = url.indexOf('IngresoRutClave') !== -1 || url.indexOf('InicioAutenticacion') !== -1
    chrome.runtime.sendMessage({
      type: 'PAGE_LOADED',
      url: url,
      isLoginPage: isLogin
    })
  }

  // Auto-extract on page load for known SII sections
  function tryAutoExtract() {
    var url = window.location.href.toLowerCase()
    var pageType = null

    if (url.indexOf('rcv') !== -1) pageType = 'rcv'
    else if (url.indexOf('dte') !== -1 && url.indexOf('emitido') !== -1) pageType = 'dte-emitidos'
    else if (url.indexOf('dte') !== -1 && url.indexOf('recibido') !== -1) pageType = 'dte-recibidos'
    else if (url.indexOf('f29') !== -1) pageType = 'f29'
    else if (url.indexOf('situacion') !== -1) pageType = 'situacion'
    else if (url.indexOf('boleta') !== -1) pageType = 'boletas'
    else if (url.indexOf('factura') !== -1) pageType = 'facturacion'
    else if (url.indexOf('libro') !== -1) pageType = 'libros'

    if (pageType) {
      extractFromPage(pageType)
    }
  }

  notifyPageLoad()
  setTimeout(tryAutoExtract, 3000)
})()
