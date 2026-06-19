export type UserRole = 'admin' | 'auditor' | 'contador' | 'lectura'

export type AuditSessionStatus = 'pending' | 'running' | 'completed' | 'failed'

export type FindingStatus = 'open' | 'confirmed' | 'dismissed'

export type FindingSeverity = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'

export type FindingCategory =
  | 'DESFALCO_FINANCIERO'
  | 'MALVERSACION_FONDOS'
  | 'ROBO_INTERNO'
  | 'MANIPULACION_CONTABLE'
  | 'FRAUDE_TRIBUTARIO'
  | 'DUPLICIDAD_PAGOS'
  | 'ALTERACION_BALANCES'
  | 'FALSIFICACION_INGRESOS'
  | 'EGRESOS_INJUSTIFICADOS'
  | 'PAGOS_FANTASMA'
  | 'TRANSFERENCIAS_SOSPECHOSAS'
  | 'DIFERENCIAS_CAJA'
  | 'FUGA_DINERO'
  | 'SOBREPRECIOS'
  | 'PROVEEDORES_FICTICIOS'
  | 'COLUSION_INTERNA'
  | 'ALTERACION_INVENTARIO'
  | 'FRAUDE_ERP'
  | 'FRAUDE_CRM'
  | 'ELIMINACION_REGISTROS'
  | 'MANIPULACION_TRIBUTARIA'
  | 'LAVADO_INTERNO'
  | 'EMPRESAS_ESPEJO'
  | 'REBAJAS_SOSPECHOSAS'
  | 'TRANSFERENCIAS_SIN_RESPALDO'
  | 'ERROR_IVA'
  | 'INCONSISTENCIA_CONTABLE'
  | 'DOCUMENTO_FALTANTE'
  | 'ANOMALIA_MONTO'
  | 'RIESGO_TRIBUTARIO'
  | 'FACTURACION_ELECTRONICA'
  | 'INCUMPLIMIENTO_FORMAL'
  | 'ALERTA_F29'

export type IntegrationType = 'erp' | 'crm' | 'banco' | 'sii' | 'pos' | 'inventario' | 'correo' | 'pasarela_pago' | 'api_contable'

export type ERPProvider = 'odoo' | 'softland' | 'defontana' | 'sap' | 'otro'
export type CRMProvider = 'salesforce' | 'hubspot' | 'otro'
export type BancoProvider = 'santander' | 'bci' | 'banco_chile' | 'bci' | 'scotiabank' | 'estado' | 'otro'

export interface Company {
  id: string
  rut: string
  razonSocial: string
  giro?: string
  direccion?: string
  telefono?: string
  email?: string
  config: CompanyConfig
  integraciones: CompanyIntegrations
  createdAt: string
  updatedAt: string
}

export interface CompanyConfig {
  recibeEfectivo: boolean
  sistemaRegistroInicial: string // POS, ERP, planilla, otro
  sistemaRebaja: string // ERP, manual, otro
  flujoDinero: MoneyFlowStep[]
}

export interface MoneyFlowStep {
  orden: number
  descripcion: string
  sistema: string
  responsable: string
}

export interface CompanyIntegrations {
  erp: ERPIntegration | null
  crm: CRMIntegration | null
  bancos: BancoIntegration[]
  sii: SIIIntegration | null
  pos: POSIntegration | null
  inventario: InventarioIntegration | null
}

export interface ERPIntegration {
  enabled: boolean
  provider: ERPProvider
  url?: string
  apiKey?: string
  database?: string
  modules: string[]
  config: Record<string, unknown>
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
}

export interface CRMIntegration {
  enabled: boolean
  provider: CRMProvider
  url?: string
  apiKey?: string
  config: Record<string, unknown>
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
}

export interface BancoIntegration {
  id: string
  enabled: boolean
  provider: BancoProvider
  cuentaNumero: string
  cuentaTipo: string
  apiKey?: string
  config: Record<string, unknown>
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
}

export interface SIIIntegration {
  enabled: boolean
  rutEmpresa: string
  certificadoDigital?: string
  status: 'connected' | 'disconnected' | 'error'
  lastSync?: string
  extraccionesProgramadas: boolean
  frecuenciaExtraccion?: 'diario' | 'semanal' | 'mensual'
}

export interface POSIntegration {
  enabled: boolean
  provider: string
  config: Record<string, unknown>
  status: 'connected' | 'disconnected' | 'error'
}

export interface InventarioIntegration {
  enabled: boolean
  provider: string
  config: Record<string, unknown>
  status: 'connected' | 'disconnected' | 'error'
}

export interface PlatformUser {
  id: string
  email: string
  passwordHash: string
  name: string
  role: UserRole
  companyId: string
  mfaEnabled: boolean
  mfaSecret?: string
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface AuditSession {
  id: string
  companyId: string
  userId: string
  status: AuditSessionStatus
  score: number
  findings: AuditFinding[]
  extractedData?: Record<string, unknown>
  startedAt: string
  completedAt?: string
  createdAt: string
}

export interface AuditFinding {
  id: string
  sessionId: string
  category: FindingCategory
  severity: FindingSeverity
  title: string
  description: string
  evidence: Record<string, unknown>
  amount?: number
  userId?: string
  userName?: string
  userRole?: string
  area?: string
  status: FindingStatus
  origin?: string
  recommendation: string
  resolvedAt?: string
  resolvedBy?: string
  createdAt: string
}

export interface Alert {
  id: string
  companyId: string
  sessionId: string
  findingId: string
  severity: FindingSeverity
  title: string
  amount?: number
  riskScore: number
  area: string
  userId?: string
  userName?: string
  origin: string
  summary: string
  status: 'active' | 'acknowledged' | 'resolved'
  acknowledgedAt?: string
  resolvedAt?: string
  createdAt: string
}

export interface FinancialRecord {
  id: string
  companyId: string
  sessionId: string
  source: string
  type: string
  amount: number
  currency: string
  date: string
  metadata: Record<string, unknown>
  hash?: string
  createdAt: string
}

export interface TokenPayload {
  sub: string
  email: string
  name: string
  role: UserRole
  companyId: string
  iat: number
  exp: number
}
