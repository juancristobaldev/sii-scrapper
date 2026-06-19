import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function validateRut(rut: string): boolean {
  const cleaned = rut.replace(/[^0-9kK]/g, '').toUpperCase()
  if (cleaned.length < 2) return false
  
  const body = cleaned.slice(0, -1)
  const dv = cleaned.slice(-1)
  
  let sum = 0
  let multiplier = 2
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  
  const expectedDV = 11 - (sum % 11)
  const expectedChar = expectedDV === 11 ? '0' : expectedDV === 10 ? 'K' : expectedDV.toString()
  
  return expectedChar === dv
}

export function cleanRut(rut: string): string {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase()
}
