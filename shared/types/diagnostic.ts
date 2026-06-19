export type Severidad = 'CRITICA' | 'ALTA' | 'MEDIA' | 'BAJA'
export type CategoriaDiagnostico =
  | 'FUGA_DINERO'
  | 'PAGO_DUPLICADO'
  | 'INCONSISTENCIA_CONTABLE'
  | 'ERROR_IVA'
  | 'DOCUMENTO_FALTANTE'
  | 'ANOMALIA_MONTO'
  | 'RIESGO_TRIBUTARIO'
  | 'FACTURACION_ELECTRONICA'
  | 'INCUMPLIMIENTO_FORMAL'
  | 'ALERTA_F29'

export interface DiagnosticoItem {
  id: string
  categoria: CategoriaDiagnostico
  severidad: Severidad
  titulo: string
  descripcion: string
  evidencia: unknown
  impactoEstimado?: number
  recomendacion: string
  resuelto: boolean
}

export interface DiagnosticoResumen {
  id: string
  sessionId: string
  fechaAnalisis: string
  periodoAnalizado: string
  scoreSalud: number
  totalHallazgos: number
  distribucion: Record<Severidad, number>
  items: DiagnosticoItem[]
  fugasDineroTotal: number
  riesgoFiscal: number
}

export interface SIIExtractedData {
  rcv?: unknown[]
  dteEmitidos?: unknown[]
  dteRecibidos?: unknown[]
  f29?: unknown[]
  librosElectronicos?: unknown[]
  situacionTributaria?: unknown
  boletas?: unknown[]
  facturacionElectronica?: unknown
}
