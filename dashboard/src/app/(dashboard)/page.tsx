'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import Link from 'next/link'
import { useAuth } from '@/lib/context/auth-context'
import { clientStore } from '@/lib/storage/store-client'
import {
  TrendingUp,
  TrendingDown,
  FileWarning,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Upload,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Search,
  Zap,
  Globe,
  Activity,
  ShieldAlert,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils/cn'

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview')
  const { user, company } = useAuth()
  const [sessionCount, setSessionCount] = useState(0)
  const [lastScore, setLastScore] = useState<number | null>(null)
  const [alertsCount, setAlertsCount] = useState(0)

  useEffect(() => {
    if (company) {
      clientStore.sessions.list().then(sessions => {
        setSessionCount(sessions.length)
        if (sessions.length > 0) setLastScore(sessions[0].score)
      })
      clientStore.alerts.list().then(alerts => {
        setAlertsCount(alerts.filter(a => a.status === 'active').length)
      })
    }
  }, [company])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {company ? company.razonSocial : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {user ? `Bienvenido, ${user.name}` : 'Plataforma de Auditoria Antifraude Financiero'}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/sii-browser">
            <Button>
              <Globe className="mr-2 h-4 w-4" />
              Auditoria SII
            </Button>
          </Link>
          <Link href="/upload">
            <Button variant="outline">
              <Upload className="mr-2 h-4 w-4" />
              Subir Datos
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-950 to-blue-900 border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-blue-100">
              <DollarSign className="h-5 w-5" />
              Auditorias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-100">{sessionCount}</p>
            <p className="text-sm text-blue-300 mt-1">Sesiones completadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-950 to-amber-900 border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-100">
              <AlertCircle className="h-5 w-5" />
              Score Actual
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-100">
              {lastScore !== null ? `${lastScore}/100` : '--'}
            </p>
            <p className="text-sm text-amber-300 mt-1">Salud financiera</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-950 to-green-900 border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-green-100">
              <ShieldCheck className="h-5 w-5" />
              Integraciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-100">
              0
            </p>
            <p className="text-sm text-green-300 mt-1">Sistemas conectados</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-950 to-purple-900 border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-purple-100">
              <Activity className="h-5 w-5" />
              Alertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-100">
              {alertsCount}
            </p>
            <p className="text-sm text-purple-300 mt-1">Activas sin resolver</p>
          </CardContent>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: 'overview', label: 'Resumen', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'modules', label: 'Modulos de Analisis', icon: <Search className="h-4 w-4" /> },
          { id: 'howto', label: 'Como Funciona', icon: <Zap className="h-4 w-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle>Estado de la Plataforma</CardTitle>
            <CardDescription>
              {company?.rut ? `RUT: ${company.rut} — ${company.razonSocial}` : 'Configura tu empresa para comenzar'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center py-12 text-center">
            {sessionCount === 0 ? (
              <>
                <FileWarning className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sin auditorias realizadas</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Conectate al SII en vivo a traves de la auditoria en iframe o sube archivos CSV exportados
                  para analizar tu informacion tributaria.
                </p>
                <Link href="/sii-browser">
                  <Button size="lg">
                    Comenzar Auditoria
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="space-y-4 w-full max-w-md">
                <div className="flex items-center gap-3 text-green-400">
                  <ShieldAlert className="h-10 w-10" />
                  <div className="text-left">
                    <p className="font-semibold">{sessionCount} auditorias completadas</p>
                    <p className="text-sm text-muted-foreground">
                      Ultimo score: {lastScore}/100
                    </p>
                  </div>
                </div>
                <Link href="/auditoria">
                  <Button className="w-full">
                    Nueva Auditoria
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analysisModules.map((mod) => (
            <Card key={mod.id}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {mod.icon}
                  {mod.title}
                </CardTitle>
                <CardDescription>{mod.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'howto' && (
        <Card>
          <CardHeader>
            <CardTitle>Como usar la Plataforma Antifraude</CardTitle>
            <CardDescription>Tres formas de analizar tus datos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <StepCard
                number="1"
                title="Configura tu empresa"
                description="Ingresa el RUT, define el flujo de dinero, conecta ERP, CRM y bancos. La plataforma construye la trazabilidad completa."
              />
              <StepCard
                number="2"
                title="Ejecuta una auditoria"
                description="Extrae datos del SII via proxy, sube archivos CSV, o conecta tus sistemas. El motor IA analiza todo automaticamente."
              />
              <StepCard
                number="3"
                title="Revisa hallazgos y alertas"
                description="La plataforma detecta: desfalco, malversacion, pagos duplicados, manipulacion contable, fraude tributario, fugas de dinero, colusion y mas."
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

const analysisModules = [
  { id: 'rcv', title: 'Analisis RCV', description: 'Registro de Compras y Ventas, duplicados e IVA mal calculado', icon: <BarChart3 className="h-4 w-4 text-blue-400" /> },
  { id: 'dte', title: 'Cruce DTE', description: 'DTEs emitidos vs recibidos, diferencias de montos', icon: <Search className="h-4 w-4 text-purple-400" /> },
  { id: 'f29', title: 'F29 vs RCV', description: 'Compara lo declarado en F29 con lo registrado en RCV', icon: <FileWarning className="h-4 w-4 text-amber-400" /> },
  { id: 'dup', title: 'Detector Duplicados', description: 'Facturas y pagos duplicados por folio, RUT y monto', icon: <AlertCircle className="h-4 w-4 text-red-400" /> },
  { id: 'leak', title: 'Fugas de Dinero', description: 'IVA no recuperado, sobreprecios, DTE reclamados', icon: <TrendingDown className="h-4 w-4 text-orange-400" /> },
  { id: 'timeline', title: 'Linea de Tiempo', description: 'Fechas inconsistentes, periodos sin actividad', icon: <TrendingUp className="h-4 w-4 text-green-400" /> },
  { id: 'missing', title: 'Docs Faltantes', description: 'Folios saltados, DTEs no registrados en RCV', icon: <FileWarning className="h-4 w-4 text-pink-400" /> },
  { id: 'rut', title: 'Validador RUT', description: 'Verifica validez de todos los RUTs en documentos', icon: <CheckCircle2 className="h-4 w-4 text-teal-400" /> },
  { id: 'anomaly', title: 'Anomalias de Monto', description: 'Montos atipicos usando analisis estadistico (IQR)', icon: <Zap className="h-4 w-4 text-yellow-400" /> },
  { id: 'tax', title: 'Situacion Tributaria', description: 'Bloqueos, anotaciones, convenios de pago', icon: <ShieldCheck className="h-4 w-4 text-indigo-400" /> },
  { id: 'eb', title: 'Facturacion Electronica', description: 'DTEs sin Track ID, rechazados, anulados', icon: <Search className="h-4 w-4 text-cyan-400" /> },
  { id: 'risk', title: 'Score de Riesgo', description: 'Calcula salud contable y riesgo fiscal compuesto', icon: <BarChart3 className="h-4 w-4 text-emerald-400" /> },
]

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
        {number}
      </div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
