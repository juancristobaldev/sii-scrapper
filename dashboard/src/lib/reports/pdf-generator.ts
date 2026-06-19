import type { DiagnosticoResumen, DiagnosticoItem } from '@shared/types/diagnostic'
import { formatCurrency, formatDate } from '@/lib/utils/cn'

interface ReportContext {
  companyName: string
  companyRut: string
  generatedBy: string
  generatedAt: string
}

function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'CRITICA': return '#dc2626'
    case 'ALTA': return '#ea580c'
    case 'MEDIA': return '#ca8a04'
    case 'BAJA': return '#64748b'
    default: return '#64748b'
  }
}

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a'
  if (score >= 50) return '#ca8a04'
  return '#dc2626'
}

function getCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    FUGA_DINERO: 'Fuga de Dinero',
    PAGO_DUPLICADO: 'Pago Duplicado',
    INCONSISTENCIA_CONTABLE: 'Inconsistencia Contable',
    ERROR_IVA: 'Error de IVA',
    DOCUMENTO_FALTANTE: 'Documento Faltante',
    ANOMALIA_MONTO: 'Anomalia de Monto',
    RIESGO_TRIBUTARIO: 'Riesgo Tributario',
    FACTURACION_ELECTRONICA: 'Facturacion Electronica',
    INCUMPLIMIENTO_FORMAL: 'Incumplimiento Formal',
    ALERTA_F29: 'Alerta F29',
  }
  return labels[cat] || cat.replace(/_/g, ' ')
}

export function generateReportHTML(diagnosis: DiagnosticoResumen, ctx: ReportContext): string {
  const items = diagnosis.items || []
  const criticos = items.filter(i => i.severidad === 'CRITICA')
  const altos = items.filter(i => i.severidad === 'ALTA')
  const score = diagnosis.scoreSalud || 0

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Informe de Auditoria Financiera - ${escapeHtml(ctx.companyName)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1e293b; background: #fff; font-size: 11pt; line-height: 1.6; }
    .page { max-width: 210mm; margin: 0 auto; padding: 20mm 15mm; }
    .cover { text-align: center; padding: 60px 0; border-bottom: 3px solid #2563eb; margin-bottom: 40px; }
    .cover h1 { font-size: 28pt; font-weight: 800; color: #1e3a5f; margin-bottom: 10px; }
    .cover .subtitle { font-size: 14pt; color: #64748b; margin-bottom: 30px; }
    .cover .shield { font-size: 48pt; margin-bottom: 20px; }
    .cover .meta { font-size: 11pt; color: #64748b; margin-top: 20px; }
    .cover .meta strong { color: #1e293b; }

    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { font-size: 16pt; font-weight: 700; color: #1e3a5f; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 15px; }
    .section-subtitle { font-size: 11pt; color: #64748b; margin-bottom: 15px; }

    .score-card { display: inline-block; text-align: center; padding: 20px 30px; border-radius: 12px; margin: 10px; }
    .score-number { font-size: 36pt; font-weight: 800; }
    .score-label { font-size: 10pt; color: #64748b; margin-top: 5px; }

    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
    .stat-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-value { font-size: 18pt; font-weight: 700; }
    .stat-label { font-size: 9pt; color: #64748b; margin-top: 4px; }

    .finding { border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin-bottom: 12px; }
    .finding-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 9pt; font-weight: 600; color: #fff; }
    .badge-category { background: #e2e8f0; color: #475569; }
    .finding-title { font-size: 12pt; font-weight: 600; }
    .finding-desc { font-size: 10pt; color: #475569; margin-bottom: 8px; }
    .finding-recommendation { background: #f0fdf4; border-left: 3px solid #16a34a; padding: 10px 15px; font-size: 10pt; color: #166534; border-radius: 4px; }
    .finding-amount { font-size: 14pt; font-weight: 700; color: #dc2626; text-align: right; }

    .flow-step { display: flex; gap: 15px; margin-bottom: 15px; }
    .flow-number { width: 32px; height: 32px; border-radius: 50%; background: #2563eb; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 10pt; flex-shrink: 0; }
    .flow-content { flex: 1; }
    .flow-title { font-weight: 600; font-size: 11pt; }
    .flow-detail { font-size: 9pt; color: #64748b; }

    .alert-critical { border-left: 4px solid #dc2626; background: #fef2f2; }
    .alert-high { border-left: 4px solid #ea580c; background: #fff7ed; }
    .alert-medium { border-left: 4px solid #ca8a04; background: #fefce8; }
    .alert-low { border-left: 4px solid #64748b; background: #f8fafc; }

    table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10pt; }
    th { background: #f1f5f9; padding: 10px; text-align: left; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; }

    .footer { margin-top: 40px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 9pt; color: #94a3b8; text-align: center; }

    .recommendations { margin-top: 20px; }
    .recommendations li { margin-bottom: 8px; font-size: 10pt; }

    .conclusion { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-top: 20px; }
    .conclusion h3 { margin-bottom: 10px; }

    @media print {
      body { background: #fff; }
      .page { padding: 10mm; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="cover">
      <div class="shield">&#128737;</div>
      <h1>INFORME DE AUDITORIA<br>FINANCIERA ANTIFRAUDE</h1>
      <p class="subtitle">Diagnostico Tributario y Deteccion de Riesgos</p>
      <div class="meta">
        <p><strong>Empresa:</strong> ${escapeHtml(ctx.companyName)}</p>
        <p><strong>RUT:</strong> ${escapeHtml(ctx.companyRut)}</p>
        <p><strong>Fecha:</strong> ${formatDate(ctx.generatedAt)}</p>
        <p><strong>Generado por:</strong> ${escapeHtml(ctx.generatedBy)}</p>
        <p><strong>Periodo analizado:</strong> ${escapeHtml(diagnosis.periodoAnalizado || 'No especificado')}</p>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">1. Resumen Ejecutivo</h2>
      <p class="section-subtitle">Resultados del escaneo financiero automatizado</p>

      <div style="text-align: center; margin: 20px 0;">
        <div class="score-card" style="background: ${getScoreColor(score)}15; border: 2px solid ${getScoreColor(score)};">
          <div class="score-number" style="color: ${getScoreColor(score)}">${score}/100</div>
          <div class="score-label">Score de Salud Financiera</div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" style="color: #dc2626">${diagnosis.totalHallazgos}</div>
          <div class="stat-label">Total Hallazgos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #dc2626">${formatCurrency(diagnosis.fugasDineroTotal || 0)}</div>
          <div class="stat-label">Fugas de Dinero</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #ea580c">${formatCurrency(diagnosis.riesgoFiscal || 0)}</div>
          <div class="stat-label">Riesgo Fiscal</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${diagnosis.items.filter(i => i.severidad === 'CRITICA' || i.severidad === 'ALTA').length}</div>
          <div class="stat-label">Alertas Criticas/Altas</div>
        </div>
      </div>

      <table>
        <tr><th>Severidad</th><th>Cantidad</th></tr>
        <tr><td style="color: #dc2626; font-weight: 600;">CRITICA</td><td>${diagnosis.distribucion?.CRITICA || 0}</td></tr>
        <tr><td style="color: #ea580c; font-weight: 600;">ALTA</td><td>${diagnosis.distribucion?.ALTA || 0}</td></tr>
        <tr><td style="color: #ca8a04; font-weight: 600;">MEDIA</td><td>${diagnosis.distribucion?.MEDIA || 0}</td></tr>
        <tr><td style="color: #64748b; font-weight: 600;">BAJA</td><td>${diagnosis.distribucion?.BAJA || 0}</td></tr>
      </table>
    </div>

    ${criticos.length > 0 ? `
    <div class="section" style="page-break-before: always;">
      <h2 class="section-title">2. Hallazgos Criticos (${criticos.length})</h2>
      <p class="section-subtitle">Requieren atencion inmediata. Posible fraude o perdida financiera significativa.</p>
      ${criticos.map(f => renderFinding(f)).join('')}
    </div>
    ` : ''}

    ${altos.length > 0 ? `
    <div class="section">
      <h2 class="section-title">3. Hallazgos de Alto Riesgo (${altos.length})</h2>
      ${altos.map(f => renderFinding(f)).join('')}
    </div>
    ` : ''}

    <div class="section" style="page-break-before: always;">
      <h2 class="section-title">${criticos.length > 0 ? '4' : altos.length > 0 ? '4' : '2'}. Todos los Hallazgos</h2>
      ${items.length === 0 ? '<p style="color: #16a34a; font-weight: 600;">No se encontraron hallazgos. La empresa muestra buena salud financiera.</p>' : ''}
      ${items.map(f => renderFindingCompact(f)).join('')}
    </div>

    <div class="section" style="page-break-before: always;">
      <h2 class="section-title">${criticos.length > 0 || altos.length > 0 ? '5' : '3'}. Trazabilidad del Dinero</h2>
      <p class="section-subtitle">Flujo del dinero desde ingreso hasta declaracion tributaria</p>
      ${renderMoneyFlow()}
    </div>

    <div class="section">
      <h2 class="section-title">6. Cuadraturas Contables</h2>
      ${renderCuadraturas()}
    </div>

    <div class="section">
      <h2 class="section-title">7. Analisis F29</h2>
      <p>Verificacion de consistencia entre el Formulario 29 y los registros contables.</p>
      ${renderF29Analysis(diagnosis)}
    </div>

    <div class="section">
      <h2 class="section-title">8. Recomendaciones</h2>
      <div class="recommendations">
        <ol>
          ${generateRecommendations(diagnosis).map(r => `<li>${escapeHtml(r)}</li>`).join('')}
        </ol>
      </div>
    </div>

    <div class="conclusion">
      <h3 style="color: #1e3a5f; font-size: 13pt;">Conclusion Final de Auditoria</h3>
      <p style="font-size: 11pt; margin-top: 10px;">
        ${generateConclusion(diagnosis, ctx)}
      </p>
      <p style="font-size: 10pt; color: #64748b; margin-top: 15px;">
        Este informe fue generado automaticamente por la Plataforma Antifraude Financiero.
        Los hallazgos deben ser verificados por un contador o auditor certificado antes de tomar acciones legales.
        La plataforma utiliza IA, machine learning y correlacion de datos para detectar patrones anomalos.
      </p>
    </div>

    <div class="footer">
      <p>Plataforma Antifraude Financiero &copy; ${new Date().getFullYear()} — Informe confidencial generado el ${formatDate(ctx.generatedAt)}</p>
      <p>Este documento contiene informacion financiera sensible. Su distribucion esta restringida.</p>
    </div>
  </div>
</body>
</html>`
}

function renderFinding(item: DiagnosticoItem): string {
  const color = getSeverityColor(item.severidad)
  const cat = getCategoryLabel(item.categoria)
  return `
  <div class="finding ${item.severidad === 'CRITICA' ? 'alert-critical' : item.severidad === 'ALTA' ? 'alert-high' : item.severidad === 'MEDIA' ? 'alert-medium' : 'alert-low'}">
    <div class="finding-header">
      <span class="badge" style="background: ${color}">${item.severidad}</span>
      <span class="badge badge-category">${escapeHtml(cat)}</span>
      ${item.impactoEstimado ? `<span style="margin-left: auto; font-weight: 700; color: #dc2626; font-size: 13pt;">${formatCurrency(item.impactoEstimado)}</span>` : ''}
    </div>
    <div class="finding-title">${escapeHtml(item.titulo)}</div>
    <div class="finding-desc">${escapeHtml(item.descripcion)}</div>
    <div class="finding-recommendation">
      <strong>Recomendacion:</strong> ${escapeHtml(item.recomendacion)}
    </div>
  </div>`
}

function renderFindingCompact(item: DiagnosticoItem): string {
  return `
  <div style="display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 10pt;">
    <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${getSeverityColor(item.severidad)}; flex-shrink: 0;"></span>
    <span style="flex: 1;">${escapeHtml(item.titulo)}</span>
    <span style="color: #64748b;">${getCategoryLabel(item.categoria)}</span>
    ${item.impactoEstimado ? `<span style="font-weight: 600; color: #dc2626;">${formatCurrency(item.impactoEstimado)}</span>` : ''}
  </div>`
}

function renderMoneyFlow(): string {
  const steps = [
    { num: 1, title: 'Ingreso de Efectivo', detail: 'Caja / POS / Recaudacion', system: 'Sistema de Caja' },
    { num: 2, title: 'Registro Inicial', detail: 'Se registra en el sistema contable', system: 'ERP' },
    { num: 3, title: 'Rebaja / Descuento', detail: 'Se descuenta del sistema como pago recibido', system: 'ERP' },
    { num: 4, title: 'Deposito Bancario', detail: 'Se deposita en cuenta bancaria empresarial', system: 'Banco' },
    { num: 5, title: 'Declaracion SII (F29)', detail: 'Se declara al Servicio de Impuestos Internos', system: 'SII' },
  ]
  return steps.map(s => `
    <div class="flow-step">
      <div class="flow-number">${s.num}</div>
      <div class="flow-content">
        <div class="flow-title">${s.title}</div>
        <div class="flow-detail">${s.detail} — Sistema: ${s.system}</div>
      </div>
    </div>
  `).join('')
}

function renderCuadraturas(): string {
  const items = [
    { label: 'Ventas vs Depositos bancarios', status: 'pendiente' },
    { label: 'IVA declarado (F29) vs Ventas reales', status: 'pendiente' },
    { label: 'Balance vs F29', status: 'pendiente' },
    { label: 'Flujo de caja vs Movimientos bancarios', status: 'pendiente' },
    { label: 'Sueldos declarados vs Pagos reales', status: 'pendiente' },
    { label: 'Inventario vs Ventas', status: 'pendiente' },
    { label: 'Compras vs Egresos', status: 'pendiente' },
    { label: 'Caja fisica vs Sistema', status: 'pendiente' },
    { label: 'Ingresado vs Rebajado', status: 'pendiente' },
    { label: 'Declarado vs Depositado', status: 'pendiente' },
  ]
  return `
  <table>
    <tr><th>Cuadratura</th><th>Estado</th></tr>
    ${items.map(i => `
    <tr>
      <td>${i.label}</td>
      <td style="color: ${i.status === 'ok' ? '#16a34a' : '#ca8a04'};">${i.status === 'ok' ? 'OK' : 'Pendiente de verificacion'}</td>
    </tr>`).join('')}
  </table>`
}

function renderF29Analysis(diagnosis: DiagnosticoResumen): string {
  const f29Items = diagnosis.items.filter(i => i.categoria === 'ALERTA_F29' || i.categoria === 'ERROR_IVA')
  if (f29Items.length === 0) {
    return '<p style="color: #64748b;">No se detectaron inconsistencias en el F29 con los datos analizados.</p>'
  }
  return f29Items.map(renderFindingCompact).join('')
}

function generateRecommendations(diagnosis: DiagnosticoResumen): string[] {
  const recs: string[] = []
  const score = diagnosis.scoreSalud || 0

  if (score < 50) {
    recs.push('REALIZAR AUDITORIA FORENSE INMEDIATA. El score de salud financiera es critico.')
  } else if (score < 80) {
    recs.push('Programar una auditoria detallada para revisar los hallazgos de alto riesgo.')
  }

  if ((diagnosis.fugasDineroTotal || 0) > 1000000) {
    recs.push('Investigar las fugas de dinero detectadas. Implementar controles de doble validacion para pagos.')
  }

  if ((diagnosis.riesgoFiscal || 0) > 5000000) {
    recs.push('Consultar con un asesor tributario para regularizar la situacion fiscal antes de una fiscalizacion del SII.')
  }

  const duplicados = diagnosis.items.filter(i => i.categoria === 'PAGO_DUPLICADO')
  if (duplicados.length > 0) {
    recs.push(`Revisar ${duplicados.length} pagos posiblemente duplicados y solicitar devolucion si corresponde.`)
  }

  recs.push('Implementar monitoreo continuo antifraude con alertas en tiempo real.')
  recs.push('Establecer politica de segregacion de funciones para prevenir colusion interna.')
  recs.push('Realizar cuadraturas contables mensuales entre ERP, CRM, bancos y SII.')
  recs.push('Capacitar al equipo contable en deteccion temprana de irregularidades.')

  return recs
}

function generateConclusion(diagnosis: DiagnosticoResumen, ctx: ReportContext): string {
  const score = diagnosis.scoreSalud || 0
  const criticas = diagnosis.items.filter(i => i.severidad === 'CRITICA').length

  if (criticas > 0) {
    return `La empresa ${escapeHtml(ctx.companyName)} presenta un nivel de RIESGO ALTO con ${criticas} hallazgos criticos que requieren atencion inmediata. El score de salud financiera es de ${score}/100, lo que indica posibles fugas de dinero, manipulacion contable o fraude interno. Se recomienda intervencion urgente del directorio y auditoria forense externa.`
  }

  if (score < 50) {
    return `La empresa ${escapeHtml(ctx.companyName)} presenta un nivel de RIESGO MEDIO con un score de ${score}/100. Si bien no se detectaron hallazgos criticos inmediatos, existen indicadores de posibles irregularidades que deben ser investigadas para prevenir perdidas mayores.`
  }

  return `La empresa ${escapeHtml(ctx.companyName)} presenta un nivel de RIESGO BAJO con un score de salud financiera de ${score}/100. Los controles actuales parecen adecuados. Se recomienda mantener el monitoreo continuo y realizar auditorias periodicas para mantener la salud financiera.`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
