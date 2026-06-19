'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Stepper, type Step } from '@/components/ux/stepper'
import { ExtractionPanel, type ExtractionSection, type SectionStatus } from '@/components/ux/extraction-panel'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/lib/context/auth-context'
import {
  Globe,
  Search,
  Loader2,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  Zap,
  ShieldCheck,
  Trash2,
  Download,
  Puzzle,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react'

const steps: Step[] = [
  { id: 'install', label: 'Instalar Extension', description: 'Agrega la extension de Chrome a tu navegador' },
  { id: 'login', label: 'Iniciar Sesion en SII', description: 'Ingresa a sii.cl con tu RUT y clave tributaria' },
  { id: 'sync', label: 'Sincronizar Datos', description: 'La extension extrae tus datos automaticamente' },
  { id: 'results', label: 'Ver Resultados', description: 'Revisa hallazgos y recomendaciones' },
]

const initialSections: ExtractionSection[] = [
  { id: 'rcv', label: 'RCV', icon: 'rcv', count: 0, status: 'pending' },
  { id: 'dte-emitidos', label: 'DTE Emitidos', icon: 'dte-emitidos', count: 0, status: 'pending' },
  { id: 'dte-recibidos', label: 'DTE Recibidos', icon: 'dte-recibidos', count: 0, status: 'pending' },
  { id: 'f29', label: 'F29', icon: 'f29', count: 0, status: 'pending' },
  { id: 'situacion', label: 'Situacion Tributaria', icon: 'situacion', count: 0, status: 'pending' },
  { id: 'boletas', label: 'Boletas Emitidas', icon: 'boletas', count: 0, status: 'pending' },
  { id: 'facturacion', label: 'Facturacion Electronica', icon: 'facturacion', count: 0, status: 'pending' },
  { id: 'libros', label: 'Libros Electronicos', icon: 'libros', count: 0, status: 'pending' },
]

const sectionLabelMap: Record<string, string> = {
  rcv: 'RCV',
  'dte-emitidos': 'DTE Emitidos',
  'dte-recibidos': 'DTE Recibidos',
  f29: 'F29',
  situacion: 'Situacion Tributaria',
  boletas: 'Boletas Emitidas',
  facturacion: 'Facturacion Electronica',
  libros: 'Libros Electronicos',
}

interface SyncStatus {
  status: string
  totalDocs: number
  lastSync: number | null
  error: string | null
  inProgress: boolean
}

export default function SIIBrowserPage() {
  const router = useRouter()
  const { company } = useAuth()

  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<number[]>([])
  const [sections, setSections] = useState<ExtractionSection[]>(initialSections)
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<Record<string, any[]> | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    totalDocs: 0,
    lastSync: null,
    error: null,
    inProgress: false,
  })
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null)

  const updateSection = useCallback((sectionId: string, count: number, status: SectionStatus) => {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, count, status } : s
    ))
  }, [])

  const refreshData = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      if (!res.ok) return
      const { sessions } = await res.json()

      if (sessions && sessions.length > 0) {
        const latest = sessions[0]
        if (latest.findings && latest.findings.length > 0) {
          setCompletedSteps(prev => {
            const updated = [...prev]
            if (!updated.includes(0)) updated.push(0)
            if (!updated.includes(1)) updated.push(1)
            if (!updated.includes(2)) updated.push(2)
            return updated
          })
          setCurrentStep(3)
        }

        if (latest.status === 'completed') {
          setSyncStatus(prev => ({ ...prev, status: 'completed', totalDocs: latest.findings?.length || 0 }))
        }
      }
    } catch {
      // Dashboard might not be running
    }
  }, [])

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 5000)
    setPollInterval(interval)
    return () => clearInterval(interval)
  }, [refreshData])

  const startPolling = useCallback(() => {
    if (pollInterval) clearInterval(pollInterval)
    const interval = setInterval(refreshData, 3000)
    setPollInterval(interval)
    syncStatus.status === 'in_progress'
  }, [refreshData, pollInterval, syncStatus.status])

  const runDiagnosis = async () => {
    setAnalyzing(true)
    setCurrentStep(2)

    const rcvData = extractedData?.rcv || []
    const dteEmitidosData = extractedData?.dteEmitidos || []
    const dteRecibidosData = extractedData?.dteRecibidos || []
    const f29Data = extractedData?.f29 || []

    if (rcvData.length === 0 && dteEmitidosData.length === 0 && dteRecibidosData.length === 0 && f29Data.length === 0) {
      setError('No hay datos para analizar. Sincroniza con el SII primero.')
      setAnalyzing(false)
      return
    }

    setError(null)

    try {
      const payload: any = { data: {} }
      if (rcvData.length > 0) payload.data.rcv = rcvData
      if (dteEmitidosData.length > 0) payload.data.dteEmitidos = dteEmitidosData
      if (dteRecibidosData.length > 0) payload.data.dteRecibidos = dteRecibidosData
      if (f29Data.length > 0) payload.data.f29 = f29Data

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()

      if (result.success && result.diagnosis) {
        localStorage.setItem('sii-diagnosis', JSON.stringify(result.diagnosis))
        setCompletedSteps(prev => [...prev, 2, 3])
        setCurrentStep(3)
        setTimeout(() => router.push('/analysis'), 800)
      } else {
        setError(result.error || 'Error en el diagnostico')
      }
    } catch {
      setError('Error de conexion al ejecutar diagnostico')
    } finally {
      setAnalyzing(false)
    }
  }

  const clearData = () => {
    setExtractedData(null)
    setSections(initialSections)
    setCompletedSteps([])
    setCurrentStep(0)
    setError(null)
    setSyncStatus({ status: 'idle', totalDocs: 0, lastSync: null, error: null, inProgress: false })
  }

  const hasData = sections.some(s => s.status === 'done') || (extractedData !== null)
  const extractedCount = sections.filter(s => s.status === 'done').length
  const canDiagnose = extractedCount >= 1 || (extractedData !== null)

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Globe className="h-6 w-6 text-primary" />
            Auditoria SII
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {company ? `${company.razonSocial} (${company.rut})` : 'Conecta tu cuenta SII y extrae tus datos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Actualizar
          </Button>
          <Button variant="ghost" size="sm" onClick={clearData} disabled={!hasData}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            Limpiar
          </Button>
        </div>
      </div>

      <Card className="flex-shrink-0">
        <CardContent className="p-4">
          <Stepper steps={steps} currentStep={currentStep} completedSteps={completedSteps} />
        </CardContent>
      </Card>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md flex items-center gap-2 text-sm text-destructive flex-shrink-0">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          {!hasData ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="max-w-lg w-full space-y-6">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
                    <Puzzle className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Conecta tu cuenta del SII</h2>
                  <p className="text-sm text-muted-foreground">
                    Instala la extension de Chrome para extraer automaticamente tus datos tributarios.
                    Solo necesitas iniciar sesion una vez en el SII.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">1</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Instala la extension</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Carga la carpeta <code className="px-1.5 py-0.5 bg-accent rounded text-xs">extension/</code> como extension sin empaquetar en Chrome.
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Ve a <code className="px-1.5 py-0.5 bg-accent rounded text-xs">chrome://extensions</code> → Modo desarrollador → Cargar descomprimida.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">2</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Inicia sesion en el SII</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Abre el SII y haz login con tu RUT y clave tributaria como lo haces normalmente.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => window.open('https://zeusr.sii.cl', '_blank')}
                      >
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                        Abrir SII en nueva pestana
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">3</div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">Sincronizacion automatica</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Al iniciar sesion en el SII, la extension detectara tu sesion y enviara las cookies al dashboard para extraer tus datos.
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {syncStatus.inProgress ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400" />
                            <span className="text-xs text-amber-400">Sincronizando...</span>
                          </>
                        ) : syncStatus.status === 'completed' ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            <span className="text-xs text-success">Sincronizacion completada</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">Esperando conexion...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-success flex-shrink-0" />
                    <span>Tus credenciales del SII nunca se almacenan. Solo se usan cookies de sesion temporales.</span>
                  </p>
                </div>

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push('/upload')}
                  >
                    <Download className="mr-1.5 h-4 w-4" />
                    O sube archivos manualmente
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 rounded-lg border border-border overflow-hidden bg-card">
              <div className="p-8 flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-success/10">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Datos sincronizados</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {extractedCount > 0
                        ? `${extractedCount} secciones extraidas del SII.`
                        : 'Los datos se recibieron correctamente.'}
                    </p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button size="sm" onClick={runDiagnosis} disabled={!canDiagnose || analyzing}>
                      {analyzing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando...</>
                      ) : (
                        <><Search className="mr-2 h-4 w-4" /> Ejecutar Diagnostico</>
                      )}
                    </Button>
                    <Button variant="outline" size="sm" onClick={clearData}>
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      Nueva Sincronizacion
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <ExtractionPanel sections={sections} />
          <Card>
            <CardContent className="p-4 space-y-3">
              <Button className="w-full" size="sm" onClick={runDiagnosis} disabled={!canDiagnose || analyzing}>
                {analyzing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analizando...</>
                ) : (
                  <><Search className="mr-2 h-4 w-4" /> Ejecutar Diagnostico</>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => window.open('https://zeusr.sii.cl', '_blank')}
              >
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Abrir SII en nueva pestana
              </Button>
              <div className="p-2.5 bg-accent/30 rounded-md text-xs text-muted-foreground">
                <p className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  <span className="font-medium text-foreground">Tus datos estan seguros</span>
                </p>
                <p className="mt-1">Los datos se procesan localmente. No compartimos credenciales.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
