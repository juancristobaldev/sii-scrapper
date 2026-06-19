import type { Metadata } from 'next'
import { Sidebar } from '@/components/layout/sidebar'

export const metadata: Metadata = {
  title: 'SII Scrapper - Auditoría Financiera',
  description: 'Plataforma inteligente de auditoría antifraude financiero empresarial',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">
        {children}
      </main>
    </div>
  )
}
