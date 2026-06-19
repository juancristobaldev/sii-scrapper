export interface F29Data {
  periodo: string
  rut: string
  razonSocial: string
  codigo: number
  descripcion: string
  valor: number
  seccion: string
}

export interface F29Resumen {
  periodo: string
  totalDebitoVentas: number
  totalCreditoCompras: number
  ivaDeterminado: number
  remanenteAnterior: number
  remanenteActual: number
  pagoProvisional: number
  totalPagar: number
}
