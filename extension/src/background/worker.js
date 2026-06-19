const API_BASE = 'http://localhost:3000/api'

let extractedData = {
  rcv: [],
  dteEmitidos: [],
  dteRecibidos: [],
  f29: [],
  librosElectronicos: [],
  situacionTributaria: null,
  boletas: [],
  facturacionElectronica: [],
}

let syncInProgress = false
let lastSyncTime = 0
const SYNC_COOLDOWN = 10 * 60 * 1000

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PAGE_LOADED':
      handlePageLoaded(message).then(result => sendResponse(result))
      return true

    case 'EXTRACT_RCV':
      handleExtractRCV(message.data)
      sendResponse({ success: true })
      break
      
    case 'EXTRACT_DTE':
      handleExtractDTE(message.data)
      sendResponse({ success: true })
      break
      
    case 'EXTRACT_F29':
      handleExtractF29(message.data)
      sendResponse({ success: true })
      break
      
    case 'EXTRACT_SITUACION':
      handleExtractSituacion(message.data)
      sendResponse({ success: true })
      break
      
    case 'EXTRACT_BOLETAS':
      handleExtractBoletas(message.data)
      sendResponse({ success: true })
      break
      
    case 'EXTRACT_FACTURACION':
      handleExtractFacturacion(message.data)
      sendResponse({ success: true })
      break

    case 'EXTRACT_LIBROS':
      handleExtractLibros(message.data)
      sendResponse({ success: true })
      break
      
    case 'GET_EXTRACTED_DATA':
      sendResponse({ data: extractedData })
      break

    case 'GET_SYNC_STATUS':
      getSyncStatus().then(status => sendResponse(status))
      return true
      
    case 'CLEAR_DATA':
      extractedData = {
        rcv: [],
        dteEmitidos: [],
        dteRecibidos: [],
        f29: [],
        librosElectronicos: [],
        situacionTributaria: null,
        boletas: [],
        facturacionElectronica: [],
      }
      chrome.storage.local.remove('siiExtractedData')
      sendResponse({ success: true })
      break
      
    case 'SEND_TO_DASHBOARD':
      sendToDashboard().then(result => sendResponse(result))
      return true
      
    case 'ANALYZE_DATA':
      analyzeData().then(result => sendResponse(result))
      return true

    case 'TRIGGER_SYNC':
      triggerManualSync().then(result => sendResponse(result))
      return true
  }
  return true
})

async function handlePageLoaded(message) {
  const { url, isLoginPage } = message

  if (isLoginPage) {
    await chrome.storage.local.set({ siiLastLoginPageUrl: url, siiLastLoginPageTime: Date.now() })
    return { success: true, action: 'login_page_detected' }
  }

  const now = Date.now()
  const { siiLastSync } = await chrome.storage.local.get('siiLastSync')
  const lastSync = siiLastSync || 0

  if (now - lastSync < SYNC_COOLDOWN) {
    return { success: true, action: 'cooldown' }
  }

  try {
    const tokenCookie = await chrome.cookies.get({ url: 'http://localhost:3000', name: 'token' })
    if (!tokenCookie) {
      return { success: true, action: 'no_dashboard_token' }
    }

    syncInProgress = true
    await chrome.storage.local.set({ siiLastSyncAttempt: now, siiSyncStatus: 'in_progress' })

    const siiCookies = await getAllSIICookies()
    const dashboardJWT = tokenCookie.value

    const res = await fetch(`${API_BASE}/sii-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${dashboardJWT}`
      },
      body: JSON.stringify({
        cookies: siiCookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: c.sameSite,
        })),
        currentUrl: url,
      })
    })

    const result = await res.json()

    if (result.success) {
      await chrome.storage.local.set({
        siiLastSync: now,
        siiSyncStatus: 'completed',
        siiSyncResult: result,
      })
    } else {
      await chrome.storage.local.set({
        siiLastSync: now,
        siiSyncStatus: 'failed',
        siiSyncError: result.error,
      })
    }

    syncInProgress = false
    return { success: true, action: 'sync_completed', result }
  } catch (err) {
    syncInProgress = false
    await chrome.storage.local.set({ siiSyncStatus: 'error', siiSyncError: err.message })
    return { success: false, action: 'sync_error', error: err.message }
  }
}

async function triggerManualSync() {
  syncInProgress = true
  await chrome.storage.local.set({ siiSyncStatus: 'in_progress' })

  try {
    const tokenCookie = await chrome.cookies.get({ url: 'http://localhost:3000', name: 'token' })
    if (!tokenCookie) {
      syncInProgress = false
      return { success: false, error: 'No estas autenticado en el dashboard. Inicia sesion en localhost:3000 primero.' }
    }

    const siiCookies = await getAllSIICookies()
    if (siiCookies.length === 0) {
      syncInProgress = false
      return { success: false, error: 'No se encontraron cookies del SII. Inicia sesion en sii.cl primero.' }
    }

    const res = await fetch(`${API_BASE}/sii-sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCookie.value}`
      },
      body: JSON.stringify({
        cookies: siiCookies.map(c => ({
          name: c.name,
          value: c.value,
          domain: c.domain,
          path: c.path,
          secure: c.secure,
          httpOnly: c.httpOnly,
          sameSite: c.sameSite,
        })),
      })
    })

    const result = await res.json()

    if (result.success) {
      await chrome.storage.local.set({
        siiLastSync: Date.now(),
        siiSyncStatus: 'completed',
        siiSyncResult: result,
      })
      if (result.data) {
        mergeExtractedData(result.data)
        await sendToDashboard()
      }
    } else {
      await chrome.storage.local.set({ siiSyncStatus: 'failed', siiSyncError: result.error })
    }

    syncInProgress = false
    return { success: result.success, result }
  } catch (err) {
    syncInProgress = false
    await chrome.storage.local.set({ siiSyncStatus: 'error', siiSyncError: err.message })
    return { success: false, error: err.message }
  }
}

async function getAllSIICookies() {
  const domains = ['.sii.cl', 'zeusr.sii.cl', 'www.sii.cl', 'www2.sii.cl', 'www3.sii.cl', 'www4.sii.cl', 'misiir.sii.cl', 'loa.sii.cl', 'homer.sii.cl']
  let allCookies = []
  const seen = new Set()

  for (const domain of domains) {
    try {
      const cookies = await chrome.cookies.getAll({ domain })
      for (const cookie of cookies) {
        const key = `${cookie.name}:${cookie.domain}:${cookie.path}`
        if (!seen.has(key)) {
          seen.add(key)
          allCookies.push(cookie)
        }
      }
    } catch (e) {
      // Domain might not have cookies
    }
  }

  return allCookies
}

function mergeExtractedData(data) {
  if (data.rcv && data.rcv.length) extractedData.rcv = data.rcv
  if (data.dteEmitidos && data.dteEmitidos.length) extractedData.dteEmitidos = data.dteEmitidos
  if (data.dteRecibidos && data.dteRecibidos.length) extractedData.dteRecibidos = data.dteRecibidos
  if (data.f29 && data.f29.length) extractedData.f29 = data.f29
  if (data.situacionTributaria) extractedData.situacionTributaria = data.situacionTributaria
  if (data.librosElectronicos && data.librosElectronicos.length) extractedData.librosElectronicos = data.librosElectronicos
  if (data.boletas && data.boletas.length) extractedData.boletas = data.boletas
  if (data.facturacionElectronica && data.facturacionElectronica.length) extractedData.facturacionElectronica = data.facturacionElectronica
  saveToStorage()
}

async function getSyncStatus() {
  const { siiSyncStatus, siiLastSync, siiSyncError, siiSyncResult, siiLastSyncAttempt } = await chrome.storage.local.get([
    'siiSyncStatus', 'siiLastSync', 'siiSyncError', 'siiSyncResult', 'siiLastSyncAttempt'
  ])

  const totalDocs = (extractedData.rcv?.length || 0) +
    (extractedData.dteEmitidos?.length || 0) +
    (extractedData.dteRecibidos?.length || 0)

  return {
    status: siiSyncStatus || 'idle',
    lastSync: siiLastSync || null,
    lastAttempt: siiLastSyncAttempt || null,
    error: siiSyncError || null,
    result: siiSyncResult || null,
    totalDocs,
    inProgress: syncInProgress,
  }
}

function handleExtractRCV(data) {
  extractedData.rcv = data
  saveToStorage()
}

function handleExtractDTE(data) {
  if (data.tipo === 'EMITIDO') {
    extractedData.dteEmitidos = data.items
  } else {
    extractedData.dteRecibidos = data.items
  }
  saveToStorage()
}

function handleExtractF29(data) {
  extractedData.f29 = data
  saveToStorage()
}

function handleExtractSituacion(data) {
  extractedData.situacionTributaria = data
  saveToStorage()
}

function handleExtractBoletas(data) {
  extractedData.boletas = data
  saveToStorage()
}

function handleExtractFacturacion(data) {
  extractedData.facturacionElectronica = data
  saveToStorage()
}

function handleExtractLibros(data) {
  extractedData.librosElectronicos = data
  saveToStorage()
}

function saveToStorage() {
  chrome.storage.local.set({ siiExtractedData: extractedData })
}

async function sendToDashboard() {
  try {
    const tokenCookie = await chrome.cookies.get({ url: 'http://localhost:3000', name: 'token' })
    if (!tokenCookie) {
      return { success: false, error: 'No estas autenticado en el dashboard' }
    }

    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenCookie.value}`
      },
      body: JSON.stringify({ data: extractedData }),
    })
    const result = await res.json()
    return { success: true, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

async function analyzeData() {
  try {
    const tokenCookie = await chrome.cookies.get({ url: 'http://localhost:3000', name: 'token' })
    const headers = { 'Content-Type': 'application/json' }
    if (tokenCookie) {
      headers['Authorization'] = `Bearer ${tokenCookie.value}`
    }

    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ data: extractedData }),
    })
    const result = await res.json()
    return { success: true, diagnosis: result.diagnosis || result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
