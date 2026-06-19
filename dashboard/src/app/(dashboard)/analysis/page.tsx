'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/utils/cn'
import Link from 'next/link'
import type { DiagnosticoResumen, Severidad } from '@shared/types/diagnostic'
import {
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  FileSearch,
  ArrowRight,
  Filter,
  Download,
} from 'lucide-react'

const severityColors: Record<Severidad, 'critical' | 'destructive' | 'warning' | 'secondary'> = {
  CRITICA: 'critical',
  ALTA: 'destructive',
  MEDIA: 'warning',
  BAJA: 'secondary',
}

const categoryLabels: Record<string, string> = {
  FUGA_DINERO: 'Fuga de Dinero',
  PAGO_DUPLICADO: 'Pago Duplicado',
  INCONSISTENCIA_CONTABLE: 'Inconsistencia Contable',
  ERROR_IVA: 'Error de IVA',
  DOCUMENTO_FALTANTE: 'Documento Faltante',
  ANOMALIA_MONTO: 'Anomalia de Monto',
  RIESGO_TRIBUTARIO: 'Riesgo Tributario',
  FACTURACION_ELECTRONICA: 'Facturacion Electronica',
  INCUMPLIMIENTO_FORMAL: 'Incumplimiento Formal',
  ALERTA_F29: 'Alerta F29',
}

export default function AnalysisPage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosticoResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [filter, setFilter] = useState<string | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('sii-diagnosis')
    if (stored) {
      try { setDiagnosis(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>
  }

  if (!diagnosis) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnostico</h1>
          <p className="text-muted-foreground mt-1">Resultados del analisis tributario</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileSearch className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin diagnostico disponible</h3>
            <p className="text-muted-foreground max-w-md mb-6">Sube tus archivos CSV o extrae del SII primero.</p>
            <Link href="/upload"><Button size="lg">Subir Datos<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const items = diagnosis.items || []
  const filteredItems = filter
    ? items.filter(i => i.categoria === filter || i.severidad === filter)
    : activeTab === 'critical'
      ? items.filter(i => i.severidad === 'CRITICA' || i.severidad === 'ALTA')
      : items

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 50) return 'text-amber-400'
    return 'text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-950 border-green-800'
    if (score >= 50) return 'bg-amber-950 border-amber-800'
    return 'bg-red-950 border-red-800'
  }

  const categories = Array.from(new Set(items.map(i => i.categoria)))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Diagnostico Tributario</h1>
          <p className="text-muted-foreground mt-1">
            {diagnosis.fechaAnalisis ? new Date(diagnosis.fechaAnalisis).toLocaleDateString('es-CL', {
              year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : ''}
          </p>
        </div>
        <Link href="/reports"><Button variant="outline"><Download className="mr-2 h-4 w-4" />Exportar Reporte</Button></Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={getScoreBg(diagnosis.scoreSalud)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Salud Contable</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${getScoreColor(diagnosis.scoreSalud)}`}>{diagnosis.scoreSalud}/100</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-950 to-red-900 border-red-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-red-100"><AlertTriangle className="h-4 w-4" />Fugas de Dinero</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-100">{formatCurrency(diagnosis.fugasDineroTotal || 0)}</p>
            <p className="text-xs text-red-300 mt-1">Pagos duplicados + IVA no recuperado</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-950 to-amber-900 border-amber-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-100"><TrendingDown className="h-4 w-4" />Riesgo Fiscal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-100">{formatCurrency(diagnosis.riesgoFiscal || 0)}</p>
            <p className="text-xs text-amber-300 mt-1">Exposicion a multas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" />Total Hallazgos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{diagnosis.totalHallazgos}</p>
            <div className="flex gap-1 mt-1">
              {(diagnosis.distribucion?.CRITICA || 0) > 0 && <Badge variant="critical">{diagnosis.distribucion.CRITICA} criticas</Badge>}
              {(diagnosis.distribucion?.ALTA || 0) > 0 && <Badge variant="destructive">{diagnosis.distribucion.ALTA} altas</Badge>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs tabs={[{ id: 'all', label: `Todos (${items.length})` }, { id: 'critical', label: 'Criticos' }]} activeTab={activeTab} onChange={setActiveTab} />

      <div className="flex gap-2 flex-wrap">
        <Button variant={filter === null ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter(null)}>Todos</Button>
        <Button variant={filter === 'CRITICA' ? 'destructive' : 'ghost'} size="sm" onClick={() => setFilter(filter === 'CRITICA' ? null : 'CRITICA')}>Critica</Button>
        <Button variant={filter === 'ALTA' ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter(filter === 'ALTA' ? null : 'ALTA')}>Alta</Button>
        {categories.map(cat => (
          <Button key={cat} variant={filter === cat ? 'secondary' : 'ghost'} size="sm" onClick={() => setFilter(filter === cat ? null : cat)}>
            {categoryLabels[cat] || cat}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card><CardContent className="py-8 text-center"><FileSearch className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">No se encontraron hallazgos con este filtro</p></CardContent></Card>
        ) : (
          filteredItems.map((item) => (
            <Card key={item.id} className="hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={severityColors[item.severidad]}>{item.severidad}</Badge>
                      <Badge variant="outline">{categoryLabels[item.categoria] || item.categoria}</Badge>
                    </div>
                    <CardTitle className="text-base">{item.titulo}</CardTitle>
                  </div>
                  {item.impactoEstimado && item.impactoEstimado > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Impacto estimado</p>
                      <p className="text-lg font-bold text-destructive">{formatCurrency(item.impactoEstimado)}</p>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{item.descripcion}</p>
                <div className="p-3 bg-accent/50 rounded-md">
                  <p className="text-sm font-medium flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-green-400" />Recomendacion:</p>
                  <p className="text-sm text-muted-foreground">{item.recomendacion}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
