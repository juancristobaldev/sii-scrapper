export interface DTE {
  tipo: number
  folio: number
  rutEmisor: string
  razonSocialEmisor: string
  rutReceptor: string
  razonSocialReceptor: string
  fechaEmision: string
  fechaRecepcion?: string
  montoNeto: number
  montoIva: number
  montoTotal: number
  estado: 'EMITIDO' | 'RECIBIDO' | 'RECLAMADO' | 'ANULADO' | 'ACEPTADO_CONTABLE' | 'RECHAZADO'
  trackId?: string
}
