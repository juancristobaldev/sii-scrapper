export interface RegistroComprasVentas {
  periodo: string
  tipo: 'COMPRA' | 'VENTA'
  rut: string
  razonSocial: string
  tipoDocumento: number
  folio: number
  fecha: string
  montoNeto: number
  montoIva: number
  montoExento: number
  montoTotal: number
  ivaRecuperable: number
  codigoSII?: string
}
