'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { formatCurrency } from '@/lib/utils/cn'
import Link from 'next/link'
import type { DiagnosticoResumen } from '@shared/types/diagnostic'
import { FileText, Download, Printer, ShieldCheck, ArrowRight } from 'lucide-react'

export default function ReportsPage() {
  const [diagnosis, setDiagnosis] = useState<DiagnosticoResumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sii-diagnosis')
    if (stored) { try { setDiagnosis(JSON.parse(stored)) } catch {} }
    setLoading(false)
  }, [])

  const exportTXT = async () => {
    if (!diagnosis) return
    setExporting(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: diagnosis }),
      })
      const data = await res.json()
      if (data.success) {
        const blob = new Blob([data.report], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `sii-diagnostico-${new Date().toISOString().split('T')[0]}.txt`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch {} finally { setExporting(false) }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner className="h-8 w-8" /></div>

  if (!diagnosis) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div><h1 className="text-3xl font-bold tracking-tight">Reportes</h1><p className="text-muted-foreground mt-1">Exporta los resultados del diagnostico</p></div>
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sin datos para reportar</h3>
            <p className="text-muted-foreground max-w-md mb-6">Sube tus archivos CSV y ejecuta el diagnostico primero.</p>
            <Link href="/upload"><Button size="lg">Ir a Subir Datos<ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const items = diagnosis.items || []

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground mt-1">
            Generado el {new Date(diagnosis.fechaAnalisis).toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Imprimir</Button>
          <Button onClick={exportTXT} disabled={exporting}>
            {exporting ? <Spinner className="mr-2" /> : <Download className="mr-2 h-4 w-4" />}Exportar TXT
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Resumen Ejecutivo</CardTitle><CardDescription>Diagnostico tributario completo</CardDescription></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-accent/50 rounded-lg"><p className="text-2xl font-bold">{diagnosis.scoreSalud}/100</p><p className="text-xs text-muted-foreground">Salud Contable</p></div>
            <div className="text-center p-4 bg-accent/50 rounded-lg"><p className="text-2xl font-bold text-destructive">{diagnosis.totalHallazgos}</p><p className="text-xs text-muted-foreground">Hallazgos</p></div>
            <div className="text-center p-4 bg-accent/50 rounded-lg"><p className="text-2xl font-bold text-destructive">{formatCurrency(diagnosis.fugasDineroTotal)}</p><p className="text-xs text-muted-foreground">Fugas de Dinero</p></div>
            <div className="text-center p-4 bg-accent/50 rounded-lg"><p className="text-2xl font-bold text-amber-400">{formatCurrency(diagnosis.riesgoFiscal)}</p><p className="text-xs text-muted-foreground">Riesgo Fiscal</p></div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Distribucion de Severidad</h4>
            <div className="flex gap-2">
              {(['CRITICA', 'ALTA', 'MEDIA', 'BAJA'] as const).map(sev => (
                <Badge key={sev} variant={sev === 'CRITICA' ? 'critical' : sev === 'ALTA' ? 'destructive' : sev === 'MEDIA' ? 'warning' : 'secondary'}>
                  {sev}: {diagnosis.distribucion?.[sev] || 0}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Hallazgos Criticos y Altos</CardTitle><CardDescription>Requieren atencion inmediata</CardDescription></CardHeader>
        <CardContent>
          {items.filter(i => i.severidad === 'CRITICA' || i.severidad === 'ALTA').length === 0 ? (
            <div className="flex items-center justify-center py-8"><div className="text-center"><ShieldCheck className="h-12 w-12 text-green-400 mx-auto mb-2" /><p className="text-muted-foreground">Sin hallazgos criticos o altos.</p></div></div>
          ) : (
            <div className="space-y-3">
              {items.filter(i => i.severidad === 'CRITICA' || i.severidad === 'ALTA').map((item) => (
                <div key={item.id} className="p-3 bg-accent/50 rounded-md">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={item.severidad === 'CRITICA' ? 'critical' : 'destructive'}>{item.severidad}</Badge>
                      <span className="text-sm font-medium">{item.titulo}</span>
                    </div>
                    {item.impactoEstimado && item.impactoEstimado > 0 && <span className="text-sm font-bold text-destructive">{formatCurrency(item.impactoEstimado)}</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{item.descripcion}</p>
                  <p className="text-xs mt-1"><span className="font-medium">Recomendacion: </span>{item.recomendacion}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Todos los Hallazgos</CardTitle><CardDescription>{items.length} hallazgos encontrados</CardDescription></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="p-2 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2">
                  <Badge variant={item.severidad === 'CRITICA' ? 'critical' : item.severidad === 'ALTA' ? 'destructive' : item.severidad === 'MEDIA' ? 'warning' : 'secondary'}>{item.severidad}</Badge>
                  <span className="text-sm">{item.titulo}</span>
                  {item.impactoEstimado && item.impactoEstimado > 0 && <span className="text-xs font-bold text-destructive ml-auto">{formatCurrency(item.impactoEstimado)}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
