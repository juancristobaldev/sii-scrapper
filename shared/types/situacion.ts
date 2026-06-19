export interface SituacionTributaria {
  rut: string
  razonSocial: string
  giro: string
  inicioActividades: string
  situacionActual: 'ACTIVO' | 'SUSPENDIDO' | 'INACTIVO' | 'NO_UBICADO'
  bloqueos?: BloqueoTributario[]
  anotaciones?: AnotacionTributaria[]
  conveniosPago?: ConvenioPago[]
}

export interface BloqueoTributario {
  tipo: string
  descripcion: string
  fecha: string
  estado: 'VIGENTE' | 'LEVANTADO'
}

export interface AnotacionTributaria {
  tipo: string
  descripcion: string
  fecha: string
  periodo: string
}

export interface ConvenioPago {
  numero: string
  fecha: string
  montoTotal: number
  cuotas: number
  cuotasPagadas: number
  estado: 'VIGENTE' | 'CADUCADO' | 'PAGADO'
}
