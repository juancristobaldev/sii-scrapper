import type { SituacionTributaria } from '@shared/types'
import type { DiagnosticoItem } from '@shared/types/diagnostic'

export function analyzeTaxSituation(situacion: SituacionTributaria): DiagnosticoItem[] {
  const diagnostics: DiagnosticoItem[] = []

  if (situacion.situacionActual === 'SUSPENDIDO') {
    diagnostics.push({
      id: 'tax-suspendido',
      categoria: 'RIESGO_TRIBUTARIO',
      severidad: 'CRITICA',
      titulo: 'Contribuyente SUSPENDIDO',
      descripcion: 'El contribuyente se encuentra suspendido. No puede emitir documentos tributarios validos.',
      evidencia: { situacionActual: situacion.situacionActual },
      impactoEstimado: 999999,
      recomendacion: 'Regularizar situacion tributaria de inmediato. Contactar al SII para levantar suspension.',
      resuelto: false,
    })
  }

  if (situacion.situacionActual === 'INACTIVO') {
    diagnostics.push({
      id: 'tax-inactivo',
      categoria: 'RIESGO_TRIBUTARIO',
      severidad: 'ALTA',
      titulo: 'Contribuyente INACTIVO',
      descripcion: 'El contribuyente esta inactivo. No esta realizando actividades economicas segun SII.',
      evidencia: { situacionActual: situacion.situacionActual },
      impactoEstimado: 0,
      recomendacion: 'Si aun hay actividad, actualizar situacion tributaria en SII.',
      resuelto: false,
    })
  }

  if (situacion.bloqueos && situacion.bloqueos.length > 0) {
    for (const bloqueo of situacion.bloqueos) {
      if (bloqueo.estado === 'VIGENTE') {
        diagnostics.push({
          id: `tax-bloqueo-${bloqueo.tipo}`,
          categoria: 'RIESGO_TRIBUTARIO',
          severidad: 'CRITICA',
          titulo: `Bloqueo tributario vigente: ${bloqueo.tipo}`,
          descripcion: `${bloqueo.descripcion || ''} (desde ${bloqueo.fecha}). Puede impedir emitir documentos o recibir devoluciones.`,
          evidencia: bloqueo,
          impactoEstimado: 999999,
          recomendacion: 'Resolver el bloqueo con el SII lo antes posible.',
          resuelto: false,
        })
      }
    }
  }

  if (situacion.anotaciones && situacion.anotaciones.length > 0) {
    diagnostics.push({
      id: 'tax-anotaciones',
      categoria: 'RIESGO_TRIBUTARIO',
      severidad: 'MEDIA',
      titulo: `${situacion.anotaciones.length} anotaciones tributarias`,
      descripcion: `El contribuyente tiene ${situacion.anotaciones.length} anotaciones registradas en el SII. Revisar cada una.`,
      evidencia: situacion.anotaciones,
      impactoEstimado: 0,
      recomendacion: 'Revisar y resolver cada anotacion. Las anotaciones afectan el historial tributario.',
      resuelto: false,
    })
  }

  if (situacion.conveniosPago && situacion.conveniosPago.length > 0) {
    for (const convenio of situacion.conveniosPago) {
      if (convenio.estado === 'VIGENTE') {
        const pendiente = convenio.cuotas - convenio.cuotasPagadas
        diagnostics.push({
          id: `tax-convenio-${convenio.numero}`,
          categoria: 'RIESGO_TRIBUTARIO',
          severidad: 'MEDIA',
          titulo: `Convenio de pago vigente: ${pendiente} cuotas pendientes`,
          descripcion: `Convenio ${convenio.numero}: ${convenio.cuotasPagadas}/${convenio.cuotas} cuotas pagadas. Monto total: $${convenio.montoTotal.toLocaleString()}.`,
          evidencia: convenio,
          impactoEstimado: (convenio.montoTotal / convenio.cuotas) * pendiente,
          recomendacion: 'Mantener las cuotas al dia para evitar caducidad del convenio.',
          resuelto: false,
        })
      }
    }
  }

  return diagnostics
}
