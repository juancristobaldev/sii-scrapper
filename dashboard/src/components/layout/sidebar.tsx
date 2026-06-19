'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/lib/context/auth-context'
import {
  LayoutDashboard,
  Upload,
  FileSearch,
  FileText,
  ShieldAlert,
  AlertTriangle,
  Globe,
  Building2,
  Search,
  ArrowRightLeft,
  Bell,
  LogOut,
  User,
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/sii-browser', label: 'Auditoria SII', icon: Globe },
  { href: '/auditoria', label: 'Nueva Auditoria', icon: Search },
  { href: '/upload', label: 'Subir Datos', icon: Upload },
  { href: '/analysis', label: 'Diagnostico', icon: FileSearch },
  { href: '/trazabilidad', label: 'Trazabilidad', icon: ArrowRightLeft },
  { href: '/alertas', label: 'Alertas', icon: Bell },
  { href: '/reports', label: 'Reportes', icon: FileText },
  { href: '/empresa', label: 'Empresa', icon: Building2 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, company, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar flex flex-col">
      <div className="p-6 border-b border-sidebar-accent">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <ShieldAlert className="h-7 w-7 text-primary" />
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">Antifraude</h1>
            <p className="text-xs text-sidebar-muted">Auditoria Financiera</p>
          </div>
        </Link>
      </div>

      {company && (
        <div className="px-3 pt-3">
          <div className="px-3 py-2 rounded-lg bg-sidebar-accent text-xs">
            <p className="text-sidebar-foreground font-medium truncate">{company.razonSocial}</p>
            <p className="text-sidebar-muted">{company.rut}</p>
          </div>
        </div>
      )}

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn('sidebar-item', isActive && 'active')}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-accent space-y-2">
        {user && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-sidebar-muted">
            <User className="h-3 w-3" />
            <span className="truncate">{user.email}</span>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-muted transition-all hover:text-sidebar-foreground hover:bg-sidebar-accent text-sm"
        >
          <LogOut className="h-4 w-4" />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </aside>
  )
}
