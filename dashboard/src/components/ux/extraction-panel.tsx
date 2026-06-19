'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  FileText,
  FileUp,
  FileDown,
  FileSpreadsheet,
  FileCheck,
  Receipt,
  BookOpen,
  ShieldCheck,
  CheckCircle2,
  Circle,
  Loader2,
} from 'lucide-react'

export type SectionStatus = 'pending' | 'extracting' | 'done'

export interface ExtractionSection {
  id: string
  label: string
  icon: string
  count: number
  status: SectionStatus
}

interface ExtractionPanelProps {
  sections: ExtractionSection[]
  onSectionClick?: (id: string) => void
}

const iconMap: Record<string, React.ReactNode> = {
  rcv: <FileText className="h-4 w-4 text-blue-400" />,
  'dte-emitidos': <FileUp className="h-4 w-4 text-green-400" />,
  'dte-recibidos': <FileDown className="h-4 w-4 text-purple-400" />,
  f29: <FileSpreadsheet className="h-4 w-4 text-amber-400" />,
  situacion: <ShieldCheck className="h-4 w-4 text-red-400" />,
  boletas: <Receipt className="h-4 w-4 text-orange-400" />,
  facturacion: <FileCheck className="h-4 w-4 text-cyan-400" />,
  libros: <BookOpen className="h-4 w-4 text-teal-400" />,
}

const statusIcon = {
  pending: <Circle className="h-3 w-3 text-muted-foreground" />,
  extracting: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
  done: <CheckCircle2 className="h-3 w-3 text-success" />,
}

export function ExtractionPanel({ sections, onSectionClick }: ExtractionPanelProps) {
  const totalExtracted = sections.filter(s => s.status === 'done').length
  const progress = sections.length > 0 ? (totalExtracted / sections.length) * 100 : 0

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Datos Extraidos</h3>
          <Badge variant={progress === 100 ? 'success' : 'secondary'} className="text-xs">
            {totalExtracted}/{sections.length}
          </Badge>
        </div>

        <Progress value={progress} className="h-1.5" />

        <div className="space-y-1">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onSectionClick?.(section.id)}
              disabled={section.status === 'pending'}
              className={`
                w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-all
                ${section.status === 'done' ? 'bg-success/10 hover:bg-success/20' : 
                  section.status === 'extracting' ? 'bg-primary/10' : 'bg-muted/30'}
                ${onSectionClick && section.status === 'done' ? 'cursor-pointer' : ''}
              `}
            >
              <div className="flex items-center gap-2">
                {iconMap[section.id] || <FileText className="h-4 w-4" />}
                <span className={section.status === 'done' ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  {section.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {section.count > 0 && (
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {section.count} reg.
                  </span>
                )}
                {statusIcon[section.status]}
              </div>
            </button>
          ))}
        </div>

        {sections.some(s => s.count > 0) && (
          <div className="text-[10px] text-muted-foreground text-center pt-1 border-t border-border">
            Navega por el SII para extraer mas datos
          </div>
        )}
      </CardContent>
    </Card>
  )
}
