'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/context/auth-context'
import { clientStore } from '@/lib/storage/store-client'
import { formatCurrency } from '@/lib/utils/cn'
import {
  ArrowRightLeft,
  DollarSign,
  Building2,
  Landmark,
  ShoppingCart,
  AlertTriangle,
  ChevronRight,
  Clock,
  User,
} from 'lucide-react'

interface FlowStep {
  id: string
  description: string
  system: string
  amount: number
  status: 'ok' | 'warning' | 'critical'
  user?: string
  date?: string
}

export default function TrazabilidadPage() {
  const { company } = useAuth()
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([])

  useEffect(() => {
    if (company) {
      clientStore.company.get().then(c => {
        const steps: FlowStep[] = []
        
        if (c?.config.recibeEfectivo) {
          steps.push({
            id: '1',
            description: 'Ingreso de efectivo',
            system: c.config.sistemaRegistroInicial || 'Caja/POS',
            amount: 0,
            status: 'warning',
            user: 'Por verificar',
            date: new Date().toISOString(),
          })
        }

        steps.push({
          id: '2',
          description: 'Registro en sistema',
          system: c?.config.sistemaRegistroInicial || 'ERP',
          amount: 0,
          status: 'ok',
          user: 'Por verificar',
          date: new Date().toISOString(),
        })

        steps.push({
          id: '3',
          description: 'Rebaja / Descuento',
          system: c?.config.sistemaRebaja || 'ERP',
          amount: 0,
          status: 'warning',
          user: 'Por verificar',
          date: new Date().toISOString(),
        })

        steps.push({
          id: '4',
          description: 'Deposito bancario',
          system: 'Banco',
          amount: 0,
          status: 'critical',
          user: 'Por verificar',
          date: new Date().toISOString(),
        })

        steps.push({
          id: '5',
          description: 'Declaracion SII (F29)',
          system: 'SII',
          amount: 0,
          status: 'warning',
          user: 'Contador',
          date: new Date().toISOString(),
        })

        setFlowSteps(steps)
      })
    }
  }, [company])

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <div className="h-3 w-3 rounded-full bg-success" />
      case 'warning': return <div className="h-3 w-3 rounded-full bg-warning" />
      case 'critical': return <div className="h-3 w-3 rounded-full bg-critical" />
      default: return <div className="h-3 w-3 rounded-full bg-muted" />
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Trazabilidad del Dinero</h1>
        <p className="text-muted-foreground mt-1">Ruta completa del dinero desde ingreso hasta declaracion</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Ingreso Total</p>
            <p className="text-lg font-bold">{formatCurrency(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Landmark className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Depositado</p>
            <p className="text-lg font-bold">{formatCurrency(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertTriangle className="h-5 w-5 text-warning mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Diferencia Detectada</p>
            <p className="text-lg font-bold text-warning">{formatCurrency(0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Declarado SII</p>
            <p className="text-lg font-bold">{formatCurrency(0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Flujo del Dinero
          </CardTitle>
          <CardDescription>
            Trazabilidad completa: seguimiento desde ingreso hasta declaracion tributaria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {flowSteps.length === 0 ? (
              <div className="text-center py-12">
                <ArrowRightLeft className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Sin datos de trazabilidad</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-4">
                  Configura el flujo de dinero de tu empresa y conecta sistemas para ver la trazabilidad completa.
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {flowSteps.map((step, i) => (
                  <div key={step.id} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      {statusIcon(step.status)}
                      {i < flowSteps.length - 1 && (
                        <div className={`w-0.5 h-12 ${step.status === 'critical' ? 'bg-critical' : step.status === 'warning' ? 'bg-warning' : 'bg-muted'}`} />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="p-4 rounded-lg border border-border bg-accent/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant={step.status === 'critical' ? 'critical' : step.status === 'warning' ? 'warning' : 'secondary'}>
                              Paso {step.id}
                            </Badge>
                            <span className="text-sm font-medium">{step.description}</span>
                          </div>
                          <span className="text-sm font-bold">{formatCurrency(step.amount)}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <ShoppingCart className="h-3 w-3" />
                            {step.system}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {step.user}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {step.date ? new Date(step.date).toLocaleDateString('es-CL') : '--'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cuadraturas Contables</CardTitle>
          <CardDescription>Verificacion automatica de consistencia entre sistemas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cuadraturas.map((c, i) => (
              <div key={i} className="p-3 bg-accent/30 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.description}</p>
                </div>
                <Badge variant={c.status === 'ok' ? 'success' : c.status === 'warning' ? 'warning' : 'secondary'}>
                  {c.status === 'ok' ? 'OK' : c.status === 'warning' ? 'Revisar' : 'Pendiente'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

const cuadraturas = [
  { label: 'Ventas vs Depositos', description: 'Compara ventas registradas con depositos bancarios', status: 'pending' },
  { label: 'IVA F29 vs Ventas', description: 'IVA declarado vs IVA en DTEs emitidos', status: 'pending' },
  { label: 'Balance vs F29', description: 'Balance contable vs formulario 29', status: 'pending' },
  { label: 'Flujo de Caja vs Banco', description: 'Flujo de caja vs movimientos bancarios reales', status: 'pending' },
  { label: 'Sueldos vs Pagos', description: 'Sueldos declarados vs pagos efectivos', status: 'pending' },
  { label: 'Inventario vs Ventas', description: 'Inventario registrado vs ventas realizadas', status: 'pending' },
  { label: 'Compras vs Egresos', description: 'Compras registradas vs egresos bancarios', status: 'pending' },
  { label: 'Caja Fisica vs Sistema', description: 'Arqueo de caja vs registro en ERP', status: 'pending' },
  { label: 'Ingresado vs Rebajado', description: 'Dinero ingresado vs dinero rebajado/descontado', status: 'pending' },
  { label: 'Declarado vs Depositado', description: 'Dinero declarado al SII vs depositado en banco', status: 'pending' },
]

