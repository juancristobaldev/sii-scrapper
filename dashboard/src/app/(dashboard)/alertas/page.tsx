'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/context/auth-context'
import { clientStore } from '@/lib/storage/store-client'
import type { Alert } from '@shared/types/entities'
import { formatCurrency } from '@/lib/utils/cn'
import {
  Bell,
  BellRing,
  AlertTriangle,
  DollarSign,
  User,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
} from 'lucide-react'

export default function AlertasPage() {
  const { company } = useAuth()
  const [alerts, setAlerts] = useState<Alert[]>([])

  useEffect(() => {
    if (company) {
      clientStore.alerts.list().then(setAlerts)
    }
  }, [company])

  const handleAcknowledge = async (id: string) => {
    await clientStore.alerts.update(id, { status: 'acknowledged', acknowledgedAt: new Date().toISOString() })
    if (company) clientStore.alerts.list().then(setAlerts)
  }

  const handleResolve = async (id: string) => {
    await clientStore.alerts.update(id, { status: 'resolved', resolvedAt: new Date().toISOString() })
    if (company) clientStore.alerts.list().then(setAlerts)
  }

  const activeAlerts = alerts.filter(a => a.status === 'active')
  const acknowledgedAlerts = alerts.filter(a => a.status === 'acknowledged')
  const resolvedAlerts = alerts.filter(a => a.status === 'resolved')

  const severityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICA': return 'critical'
      case 'ALTA': return 'destructive'
      case 'MEDIA': return 'warning'
      default: return 'secondary'
    }
  }

  const AlertCard = ({ alert }: { alert: Alert }) => (
    <Card key={alert.id} className={alert.severity === 'CRITICA' ? 'border-critical/50' : alert.severity === 'ALTA' ? 'border-destructive/50' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={severityColor(alert.severity)}>{alert.severity}</Badge>
              <Badge variant="outline">{alert.area}</Badge>
              <span className="text-xs text-muted-foreground">
                <Clock className="h-3 w-3 inline mr-1" />
                {new Date(alert.createdAt).toLocaleDateString('es-CL')}
              </span>
            </div>
            <CardTitle className="text-base">{alert.title}</CardTitle>
          </div>
          {alert.amount && alert.amount > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-destructive">{formatCurrency(alert.amount)}</p>
              <p className="text-xs text-muted-foreground">Monto detectado</p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-2">{alert.summary}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
          {alert.userName && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {alert.userName}
            </span>
          )}
          <span className="flex items-center gap-1">
            <ShieldAlert className="h-3 w-3" />
            Score riesgo: {alert.riskScore}/100
          </span>
          <span className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {alert.origin}
          </span>
        </div>
        {alert.status === 'active' && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
              <BellRing className="mr-1 h-3 w-3" />
              Reconocer
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Resolver
            </Button>
          </div>
        )}
        {alert.status === 'acknowledged' && (
          <div className="flex gap-2 text-xs text-amber-400">
            <BellRing className="h-3 w-3" /> Reconocida — pendiente resolucion
          </div>
        )}
        {alert.status === 'resolved' && (
          <div className="flex gap-2 text-xs text-success">
            <CheckCircle2 className="h-3 w-3" /> Resuelta el {new Date(alert.resolvedAt!).toLocaleDateString('es-CL')}
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centro de Alertas</h1>
        <p className="text-muted-foreground mt-1">
          {activeAlerts.length} activas · {acknowledgedAlerts.length} en revision · {resolvedAlerts.length} resueltas
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-red-950 to-red-900 border-red-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-100">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-2xl font-bold">{activeAlerts.length}</span>
            </div>
            <p className="text-xs text-red-300 mt-1">Alertas Activas</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-950 to-amber-900 border-amber-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-100">
              <BellRing className="h-5 w-5" />
              <span className="text-2xl font-bold">{acknowledgedAlerts.length}</span>
            </div>
            <p className="text-xs text-amber-300 mt-1">En Revision</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-100">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-2xl font-bold">{resolvedAlerts.length}</span>
            </div>
            <p className="text-xs text-green-300 mt-1">Resueltas</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="h-5 w-5 text-destructive" />
          Alertas Activas ({activeAlerts.length})
        </h2>
        {activeAlerts.length === 0 ? (
          <Card><CardContent className="py-8 text-center"><ShieldAlert className="h-12 w-12 text-green-400 mx-auto mb-3" /><p className="text-muted-foreground">Sin alertas activas. ¡Todo en orden!</p></CardContent></Card>
        ) : (
          activeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
        )}
      </div>

      {acknowledgedAlerts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BellRing className="h-5 w-5 text-amber-400" />
            En Revision ({acknowledgedAlerts.length})
          </h2>
          {acknowledgedAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      )}
    </div>
  )
}
