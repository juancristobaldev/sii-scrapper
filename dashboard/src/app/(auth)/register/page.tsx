'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/context/auth-context'
import { ShieldAlert, Loader2, ChevronRight, ChevronLeft, Eye, EyeOff, Building2, DollarSign, CreditCard, ArrowRightLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const STEPS = [
  { title: 'Empresa', icon: Building2, description: 'Datos de la empresa' },
  { title: 'Flujo de Dinero', icon: DollarSign, description: 'Cómo se mueve el efectivo' },
  { title: 'Sistemas', icon: CreditCard, description: 'Sistemas utilizados' },
  { title: 'Cuenta', icon: ShieldAlert, description: 'Credenciales de acceso' },
]

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [rutEmpresa, setRutEmpresa] = useState('')
  const [razonSocial, setRazonSocial] = useState('')
  const [recibeEfectivo, setRecibeEfectivo] = useState<boolean | null>(null)
  const [sistemaRegistroInicial, setSistemaRegistroInicial] = useState('')
  const [sistemaRebaja, setSistemaRebaja] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { register, loading } = useAuth()
  const router = useRouter()

  const sistemasERP = ['Odoo', 'Softland', 'Defontana', 'SAP', 'Excel/Planilla', 'No tengo ERP']
  const sistemasRegistro = ['POS/Caja', 'ERP', 'Planilla Excel', 'CRM', 'Libro físico', 'No sé']

  const handleRegister = async () => {
    setError(null)

    if (!rutEmpresa || !razonSocial || !name || !email || !password) {
      setError('Completa todos los campos obligatorios')
      return
    }

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }

    try {
      await register({
        email,
        password,
        name,
        rutEmpresa,
        razonSocial,
        recibeEfectivo: recibeEfectivo ?? false,
        sistemaRegistroInicial,
        sistemaRebaja,
      })
      router.push('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar')
    }
  }

  const canNext = () => {
    if (step === 0) return rutEmpresa.length >= 8 && razonSocial.length > 2
    if (step === 1) return recibeEfectivo !== null
    if (step === 2) return sistemaRegistroInicial !== ''
    if (step === 3) return name && email && password.length >= 8
    return true
  }

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ShieldAlert className="h-6 w-6 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl">Registrar Empresa</CardTitle>
        <CardDescription>
          Configura tu empresa para el monitoreo antifraude
        </CardDescription>

        <div className="flex justify-center gap-1 pt-4">
          {STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                i === step
                  ? 'bg-primary text-primary-foreground'
                  : i < step
                  ? 'bg-success/20 text-success'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              <s.icon className="h-3 w-3" />
              <span className="hidden sm:inline">{s.title}</span>
            </div>
          ))}
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
            {error}
          </div>
        )}

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">RUT Empresa *</label>
              <Input
                placeholder="99.999.999-K"
                value={rutEmpresa}
                onChange={(e) => setRutEmpresa(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Razón Social *</label>
              <Input
                placeholder="Nombre de la empresa"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
              Esto es obligatorio para construir la trazabilidad del dinero en la plataforma.
            </p>

            <div className="space-y-3">
              <p className="text-sm font-medium">¿La empresa recibe dinero en efectivo?</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRecibeEfectivo(true)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    recibeEfectivo === true
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="font-medium">Sí, recibe efectivo</div>
                  <div className="text-xs text-muted-foreground mt-1">Caja física, POS, recaudación</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRecibeEfectivo(false)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    recibeEfectivo === false
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  }`}
                >
                  <div className="font-medium">No recibe efectivo</div>
                  <div className="text-xs text-muted-foreground mt-1">Solo transferencias, tarjetas</div>
                </button>
              </div>
            </div>

            {recibeEfectivo === true && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">¿En qué sistema se registra inicialmente el efectivo?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {sistemasRegistro.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSistemaRegistroInicial(s)}
                        className={`p-2 rounded-lg border text-sm transition-all ${
                          sistemaRegistroInicial === s
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/30'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">¿Cómo se rebaja/descuenta el dinero del sistema?</label>
                  <Input
                    placeholder="Ej: Se ingresa manualmente al ERP Odoo como pago recibido"
                    value={sistemaRebaja}
                    onChange={(e) => setSistemaRebaja(e.target.value)}
                    className="bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    Describe el proceso: quién rebaja, cuándo, en qué sistema
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">¿Qué ERP utilizan?</label>
              <div className="grid grid-cols-2 gap-2">
                {sistemasERP.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSistemaRegistroInicial(prev => prev || s)}
                    className={`p-3 rounded-lg border text-sm transition-all hover:border-primary/30 ${
                      sistemaRegistroInicial === s ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-sm text-warning-foreground">
              Las integraciones con ERP, CRM, bancos y SII se configurarán en detalle al iniciar sesión.
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tu Nombre *</label>
              <Input
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email *</label>
              <Input
                type="email"
                placeholder="correo@empresa.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contraseña *</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary/50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-6">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
          )}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canNext()} className="flex-1">
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleRegister} disabled={loading || !canNext()} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </Button>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">
            Iniciar Sesión
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
