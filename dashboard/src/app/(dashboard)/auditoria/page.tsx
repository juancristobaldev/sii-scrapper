'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/context/auth-context'
import { clientStore } from '@/lib/storage/store-client'
import type { AuditSession } from '@shared/types/entities'
import {
  Search,
  Play,
  FileWarning,
  ShieldCheck,
  Loader2,
  ArrowRight,
  Globe,
  Upload,
} from 'lucide-react'
import Link from 'next/link'

export default function AuditoriaPage() {
  const router = useRouter()
  const { user, company } = useAuth()
  const [running, setRunning] = useState(false)
  const [rutAuditar, setRutAuditar] = useState(company?.rut || '')
  const [periodo, setPeriodo] = useState(new Date().toISOString().slice(0, 7))

  const [sessions, setSessions] = useState<AuditSession[]>([])

  useEffect(() => {
    if (company) clientStore.sessions.list().then(setSessions)
  }, [company])

  const startAudit = async () => {
    if (!user || !company) return
    setRunning(true)
    await clientStore.sessions.create()
    setRunning(false)
    router.push('/sii-browser')
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Auditoria</h1>
        <p className="text-muted-foreground mt-1">Inicia un escaneo financiero completo</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Parametros de Auditoria</CardTitle>
          <CardDescription>Configura la empresa y el periodo a analizar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">RUT Empresa</label>
              <Input value={rutAuditar} onChange={e => setRutAuditar(e.target.value)} placeholder="99.999.999-K" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Periodo</label>
              <Input type="month" value={periodo} onChange={e => setPeriodo(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <Link href="/sii-browser" className="block">
              <Button className="w-full h-20 flex-col gap-1" variant="outline">
                <Globe className="h-5 w-5" />
                <span className="text-xs">Extraer del SII</span>
              </Button>
            </Link>
            <Link href="/upload" className="block">
              <Button className="w-full h-20 flex-col gap-1" variant="outline">
                <Upload className="h-5 w-5" />
                <span className="text-xs">Subir Archivos CSV</span>
              </Button>
            </Link>
            <Button className="w-full h-20 flex-col gap-1" onClick={startAudit} disabled={running}>
              {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Play className="h-5 w-5" />}
              <span className="text-xs">{running ? 'Iniciando...' : 'Auditoria Rapida'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />Historial de Auditorias</CardTitle>
          <CardDescription>{sessions.length} auditorias realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <FileWarning className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No hay auditorias previas</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant={s.status === 'completed' ? 'success' : s.status === 'failed' ? 'destructive' : 'warning'}>
                      {s.status}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">Score: {s.score}/100</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(s.createdAt).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">{s.findings.length} hallazgos</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
