'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { Upload, FileCheck, X, FileText, ArrowRight, Database } from 'lucide-react'

interface FileState {
  name: string
  size: number
  section: string
}

export default function UploadPage() {
  const router = useRouter()
  const [files, setFiles] = useState<FileState[]>([])
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)

  const addFile = (section: string, file: File | null) => {
    if (!file) return
    setFiles(prev => {
      const filtered = prev.filter(f => f.section !== section)
      return [...filtered, { name: file.name, size: file.size, section }]
    })
    setResult(null)
    setError(null)
  }

  const removeFile = (section: string) => {
    setFiles(prev => prev.filter(f => f.section !== section))
    setResult(null)
    setError(null)
  }

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData(e.target as HTMLFormElement)
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
        const analysisRes = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: {
              rcv: data.data.rcv,
              dteEmitidos: data.data.dteEmitidos,
              dteRecibidos: data.data.dteRecibidos,
              f29: data.data.f29,
            },
          }),
        })
        const analysisData = await analysisRes.json()
        if (analysisData.success) {
          localStorage.setItem('sii-diagnosis', JSON.stringify(analysisData.diagnosis))
          router.push('/analysis')
        }
      } else {
        setError(data.error || 'Error al procesar')
      }
    } catch {
      setError('Error de conexion. Intenta de nuevo.')
    } finally {
      setUploading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Subir Datos del SII</h1>
        <p className="text-muted-foreground mt-1">
          Exporta tus datos desde el portal del SII en formato CSV y subelos aqui
        </p>
      </div>

      <form ref={formRef} onSubmit={handleUpload}>
        <div className="space-y-4">
          {uploadSections.map((section) => (
            <Card key={section.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {section.icon}
                      {section.title}
                    </CardTitle>
                    <CardDescription>{section.description}</CardDescription>
                  </div>
                  {files.find(f => f.section === section.id) ? (
                    <Badge variant="success" className="flex items-center gap-1">
                      <FileCheck className="h-3 w-3" />
                      Listo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Pendiente</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {files.find(f => f.section === section.id) ? (
                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-md">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{files.find(f => f.section === section.id)!.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ({formatSize(files.find(f => f.section === section.id)!.size)})
                      </span>
                    </div>
                    <Button variant="ghost" size="sm" type="button" onClick={() => removeFile(section.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-md cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">Click para subir CSV</span>
                    <input
                      type="file"
                      name={section.id}
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={(e) => addFile(section.id, e.target.files?.[0] || null)}
                    />
                  </label>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {error && (
          <Card className="mt-4 border-destructive">
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}

        {result && (
          <Card className="mt-4 border-green-800 bg-green-950/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-green-400 mb-2">
                <FileCheck className="h-4 w-4" />
                <span className="text-sm font-medium">Datos procesados</span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-green-300">
                <span>RCV: {result.countRcv || 0}</span>
                <span>DTE Emitidos: {result.countDteEmitidos || 0}</span>
                <span>DTE Recibidos: {result.countDteRecibidos || 0}</span>
                <span>F29: {result.countF29 || 0}</span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button type="submit" size="lg" disabled={files.length === 0 || uploading}>
            {uploading ? (
              <><Spinner className="mr-2" /> Analizando...</>
            ) : (
              <><Database className="mr-2 h-4 w-4" /> Procesar y Analizar<ArrowRight className="ml-2 h-4 w-4" /></>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

const uploadSections = [
  { id: 'rcv', title: 'Registro de Compras y Ventas (RCV)', description: 'Exporta el RCV desde zeusr.sii.cl en formato CSV', icon: <FileText className="h-4 w-4 text-blue-400" /> },
  { id: 'dteEmitidos', title: 'DTE Emitidos', description: 'Exporta tus Documentos Tributarios Electronicos emitidos', icon: <FileText className="h-4 w-4 text-green-400" /> },
  { id: 'dteRecibidos', title: 'DTE Recibidos', description: 'Exporta los DTEs recibidos de tus proveedores', icon: <FileText className="h-4 w-4 text-purple-400" /> },
  { id: 'f29', title: 'Formularios F29', description: 'Exporta los datos de tus declaraciones mensuales de IVA', icon: <FileText className="h-4 w-4 text-amber-400" /> },
]
