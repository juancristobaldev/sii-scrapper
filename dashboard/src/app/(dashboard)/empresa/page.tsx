'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/context/auth-context'
import { clientStore } from '@/lib/storage/store-client'
import type { Company, CompanyIntegrations, ERPIntegration, BancoIntegration, SIIIntegration } from '@shared/types/entities'
import {
  Building2,
  DollarSign,
  ArrowRightLeft,
  Save,
  Database,
  Globe,
  Landmark,
  ShoppingCart,
  Users,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

export default function EmpresaPage() {
  const { company } = useAuth()
  const [config, setConfig] = useState({
    recibeEfectivo: false,
    sistemaRegistroInicial: '',
    sistemaRebaja: '',
    flujoDinero: [] as { orden: number; descripcion: string; sistema: string; responsable: string }[],
  })
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('config')

  const [loadingData, setLoadingData] = useState(true)
  const [companyData, setCompanyData] = useState<Company | null>(null)

  useEffect(() => {
    if (company) {
      clientStore.company.get().then(c => {
        if (c) {
          setConfig(c.config)
          setCompanyData(c)
        }
        setLoadingData(false)
      })
    }
  }, [company])

  const saveConfig = async () => {
    if (!company) return
    await clientStore.company.update({ config } as any)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const toggleIntegracion = async (tipo: string) => {
    if (!company || !companyData) return
    const c = { ...companyData }
    let integraciones = { ...c.integraciones }

    if (tipo === 'erp') {
      integraciones.erp = integraciones.erp
        ? null
        : { enabled: true, provider: 'odoo' as const, modules: [], config: {}, status: 'disconnected' as const, url: '' }
    }
    if (tipo === 'banco') {
      if (integraciones.bancos.length > 0) {
        integraciones.bancos = []
      } else {
        integraciones.bancos = [{
          id: crypto.randomUUID(),
          enabled: true,
          provider: 'santander' as const,
          cuentaNumero: '',
          cuentaTipo: 'corriente',
          config: {},
          status: 'disconnected' as const,
        }]
      }
    }
    if (tipo === 'sii') {
      integraciones.sii = integraciones.sii
        ? null
        : { enabled: true, rutEmpresa: c.rut, status: 'disconnected' as const, lastSync: '', extraccionesProgramadas: false }
    }

    const updated = await clientStore.company.update({ integraciones } as any)
    if (updated) setCompanyData(updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addFlujoStep = () => {
    setConfig(prev => ({
      ...prev,
      flujoDinero: [
        ...prev.flujoDinero,
        { orden: prev.flujoDinero.length + 1, descripcion: '', sistema: '', responsable: '' },
      ],
    }))
  }

  if (!company) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card><CardContent className="py-12 text-center"><Building2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground" /><p className="text-muted-foreground">Cargando datos de empresa...</p></CardContent></Card>
      </div>
    )
  }

  const integraciones = companyData?.integraciones

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuracion de Empresa</h1>
          <p className="text-muted-foreground mt-1">{company.razonSocial} — RUT {company.rut}</p>
        </div>
      </div>

      <div className="flex gap-2">
        {(['config', 'integraciones', 'flujo'] as const).map(tab => (
          <Button key={tab} variant={activeTab === tab ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab(tab)}>
            {tab === 'config' ? 'Datos' : tab === 'integraciones' ? 'Integraciones' : 'Flujo de Dinero'}
          </Button>
        ))}
      </div>

      {activeTab === 'config' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Flujo de Efectivo</CardTitle>
            <CardDescription>Configura como se mueve el dinero en tu empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">¿Recibe efectivo?</label>
              <div className="flex gap-2">
                <Button variant={config.recibeEfectivo ? 'default' : 'outline'} size="sm" onClick={() => setConfig(p => ({ ...p, recibeEfectivo: true }))}>Si</Button>
                <Button variant={!config.recibeEfectivo ? 'default' : 'outline'} size="sm" onClick={() => setConfig(p => ({ ...p, recibeEfectivo: false }))}>No</Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sistema de registro inicial</label>
              <Input value={config.sistemaRegistroInicial} onChange={e => setConfig(p => ({ ...p, sistemaRegistroInicial: e.target.value }))} placeholder="Ej: Caja registradora POS, ERP Odoo, Planilla" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">¿Como se rebaja/descuenta el dinero?</label>
              <Input value={config.sistemaRebaja} onChange={e => setConfig(p => ({ ...p, sistemaRebaja: e.target.value }))} placeholder="Ej: Se registra en Odoo como pago recibido" />
            </div>

            <Button onClick={saveConfig} className="w-full">
              {saved ? <><CheckCircle2 className="mr-2 h-4 w-4" />Guardado</> : <><Save className="mr-2 h-4 w-4" />Guardar Configuracion</>}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'integraciones' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />ERP</CardTitle>
                  <CardDescription>Conecta tu sistema ERP (Odoo, Softland, Defontana, SAP)</CardDescription>
                </div>
                <Badge variant={integraciones?.erp?.enabled ? 'success' : 'secondary'} className="flex items-center gap-1">
                  {integraciones?.erp?.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {integraciones?.erp?.enabled ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {integraciones?.erp?.enabled ? (
                <div className="space-y-2">
                  <p className="text-sm">Proveedor: <span className="font-medium capitalize">{integraciones.erp.provider}</span></p>
                  <Button variant="outline" size="sm" onClick={() => toggleIntegracion('erp')}>Desconectar</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Conecta tu ERP para detectar modificaciones de facturas, cambios manuales, usuarios sospechosos y descuadres contables.</p>
                  <Button size="sm" onClick={() => toggleIntegracion('erp')}>Conectar ERP</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Landmark className="h-5 w-5" />Bancos</CardTitle>
                  <CardDescription>Conecta tus cuentas bancarias para cuadraturas automaticas</CardDescription>
                </div>
                <Badge variant={integraciones?.bancos?.some(b => b.enabled) ? 'success' : 'secondary'} className="flex items-center gap-1">
                  {integraciones?.bancos?.some(b => b.enabled) ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {(integraciones?.bancos || []).filter(b => b.enabled).length} bancos
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Detecta transferencias repetidas, pagos fraccionados, montos redondos sospechosos y movimientos fuera de horario.</p>
              <Button size="sm" onClick={() => toggleIntegracion('banco')}>
                {(integraciones?.bancos || []).filter(b => b.enabled).length > 0 ? 'Gestionar Bancos' : 'Conectar Banco'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />SII</CardTitle>
                  <CardDescription>Extraccion automatica de datos tributarios</CardDescription>
                </div>
                <Badge variant={integraciones?.sii?.enabled ? 'success' : 'secondary'} className="flex items-center gap-1">
                  {integraciones?.sii?.enabled ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                  {integraciones?.sii?.enabled ? 'Conectado' : 'Desconectado'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Extrae F29, RCV, DTE, libros electronicos y situacion tributaria automaticamente.</p>
              <Button size="sm" onClick={() => toggleIntegracion('sii')}>
                {integraciones?.sii?.enabled ? 'Configurar SII' : 'Conectar SII'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'flujo' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ArrowRightLeft className="h-5 w-5" />Trazabilidad del Dinero</CardTitle>
            <CardDescription>Define la ruta completa del dinero en tu empresa</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {config.flujoDinero.map((step, i) => (
              <div key={i} className="p-4 border border-border rounded-lg space-y-3">
                <p className="text-sm font-medium">Paso {step.orden}</p>
                <Input placeholder="Descripcion del paso" value={step.descripcion} onChange={e => {
                  const newFlujo = [...config.flujoDinero]
                  newFlujo[i].descripcion = e.target.value
                  setConfig(p => ({ ...p, flujoDinero: newFlujo }))
                }} />
                <Input placeholder="Sistema (ERP, POS, etc.)" value={step.sistema} onChange={e => {
                  const newFlujo = [...config.flujoDinero]
                  newFlujo[i].sistema = e.target.value
                  setConfig(p => ({ ...p, flujoDinero: newFlujo }))
                }} />
                <Input placeholder="Responsable" value={step.responsable} onChange={e => {
                  const newFlujo = [...config.flujoDinero]
                  newFlujo[i].responsable = e.target.value
                  setConfig(p => ({ ...p, flujoDinero: newFlujo }))
                }} />
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addFlujoStep}>Agregar Paso</Button>
              <Button size="sm" onClick={saveConfig}>{saved ? <><CheckCircle2 className="mr-2 h-4 w-4" />Guardado</> : <><Save className="mr-2 h-4 w-4" />Guardar</>}</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
