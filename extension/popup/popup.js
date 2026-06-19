document.addEventListener('DOMContentLoaded', async () => {
  const statusText = document.getElementById('status-text')
  const countDocs = document.getElementById('count-docs')
  const syncBtn = document.getElementById('btn-sync')
  const syncSpinner = document.getElementById('sync-spinner')
  const syncLabel = document.getElementById('sync-label')

  async function refreshStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' })
      if (response) {
        countDocs.textContent = response.totalDocs || 0

        if (response.inProgress) {
          statusText.textContent = 'Sincronizando con SII...'
          statusText.style.color = '#f59e0b'
          syncBtn.disabled = true
          syncSpinner.style.display = 'inline'
          syncLabel.textContent = 'Sincronizando...'
        } else if (response.status === 'completed') {
          statusText.textContent = response.totalDocs > 0
            ? `${response.totalDocs} documentos sincronizados.`
            : 'Sincronizacion completada.'
          statusText.style.color = '#22c55e'
          syncBtn.disabled = false
          syncSpinner.style.display = 'none'
          syncLabel.textContent = 'Sincronizar Ahora'
        } else if (response.status === 'failed' || response.status === 'error') {
          statusText.textContent = response.error || 'Error en sincronizacion'
          statusText.style.color = '#ef4444'
          syncBtn.disabled = false
          syncSpinner.style.display = 'none'
          syncLabel.textContent = 'Reintentar'
        } else {
          statusText.textContent = response.totalDocs > 0
            ? `${response.totalDocs} docs extraidos.`
            : 'Navega al SII y haz login para sincronizar.'
          statusText.style.color = response.totalDocs > 0 ? '#22c55e' : '#94a3b8'
          syncBtn.disabled = false
          syncSpinner.style.display = 'none'
          syncLabel.textContent = 'Sincronizar Ahora'
        }

        if (response.lastSync) {
          document.getElementById('last-sync').textContent = new Date(response.lastSync).toLocaleTimeString()
          document.getElementById('last-sync-row').style.display = 'flex'
        }
      }
    } catch (err) {
      statusText.textContent = 'Dashboard no disponible. Ejecuta localhost:3000'
      statusText.style.color = '#ef4444'
    }
  }

  await refreshStatus()

  try {
    const result = await chrome.storage.local.get('siiExtractedData')
    const data = result.siiExtractedData
    if (data) {
      const total = (data.rcv?.length || 0) + (data.dteEmitidos?.length || 0) + (data.dteRecibidos?.length || 0)
      countDocs.textContent = total

      if (total > 0) {
        statusText.textContent = `${total} documentos extraidos. Abre el dashboard para ver el diagnostico.`
        statusText.style.color = '#22c55e'
      }
    }
  } catch {}

  try {
    const diagResult = await chrome.storage.local.get('siiDiagnosis')
    const diagnosis = diagResult.siiDiagnosis
    if (diagnosis) {
      document.getElementById('count-findings').textContent = diagnosis.totalHallazgos || 0
    }
  } catch {}

  syncBtn?.addEventListener('click', async () => {
    syncBtn.disabled = true
    syncSpinner.style.display = 'inline'
    syncLabel.textContent = 'Sincronizando...'
    statusText.textContent = 'Conectando con SII...'
    statusText.style.color = '#f59e0b'

    try {
      const result = await chrome.runtime.sendMessage({ type: 'TRIGGER_SYNC' })
      await refreshStatus()
    } catch (err) {
      statusText.textContent = 'Error de conexion'
      statusText.style.color = '#ef4444'
      syncBtn.disabled = false
      syncSpinner.style.display = 'none'
      syncLabel.textContent = 'Sincronizar Ahora'
    }
  })

  document.getElementById('open-dashboard')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'http://localhost:3000' })
  })

  document.getElementById('open-sii')?.addEventListener('click', () => {
    chrome.tabs.create({ url: 'https://zeusr.sii.cl' })
  })
})
