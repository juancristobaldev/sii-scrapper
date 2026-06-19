export interface LibroElectronico {
  periodo: string
  tipoLibro: 'COMPRAS' | 'VENTAS' | 'MAYOR' | 'DIARIO' | 'INVENTARIO' | 'BALANCE'
  rut: string
  estado: 'ENVIADO' | 'NO_ENVIADO' | 'ACEPTADO' | 'RECHAZADO' | 'PENDIENTE'
  fechaEnvio?: string
  fechaAceptacion?: string
  observaciones?: string
}
