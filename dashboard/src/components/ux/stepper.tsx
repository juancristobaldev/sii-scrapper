'use client'

import { cn } from '@/lib/utils/cn'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

export interface Step {
  id: string
  label: string
  description: string
}

interface StepperProps {
  steps: Step[]
  currentStep: number
  completedSteps: number[]
}

export function Stepper({ steps, currentStep, completedSteps }: StepperProps) {
  return (
    <div className="flex items-center w-full">
      {steps.map((step, index) => {
        const isCompleted = completedSteps.includes(index)
        const isCurrent = index === currentStep
        const isLast = index === steps.length - 1

        return (
          <div key={step.id} className="flex-1 flex items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all',
                  isCompleted && 'bg-success border-success text-success-foreground',
                  isCurrent && !isCompleted && 'bg-primary border-primary text-primary-foreground ring-4 ring-primary/20',
                  !isCompleted && !isCurrent && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                )}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <div className="text-center mt-2">
                <p
                  className={cn(
                    'text-xs font-semibold',
                    isCompleted && 'text-success',
                    isCurrent && 'text-primary',
                    !isCompleted && !isCurrent && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 max-w-[120px]">
                  {step.description}
                </p>
              </div>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'h-0.5 flex-1 -mt-8 mx-1',
                  isCompleted ? 'bg-success' : 'bg-border',
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
