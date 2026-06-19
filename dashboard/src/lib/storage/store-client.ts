import type { Company, AuditSession, Alert } from '@shared/types/entities'

const API = {
  company: '/api/company',
  sessions: '/api/sessions',
  alerts: '/api/alerts-api',
}

async function fetchAPI<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options?.headers || {}),
      },
    })
    if (!res.ok) return null
    const data = await res.json()
    return data as T
  } catch {
    return null
  }
}

export const clientStore = {
  company: {
    async get(): Promise<Company | null> {
      const data = await fetchAPI<{ company: Company }>(API.company)
      return data?.company || null
    },

    async update(updates: Partial<Company>): Promise<Company | null> {
      const data = await fetchAPI<{ company: Company }>(API.company, {
        method: 'PUT',
        body: JSON.stringify(updates),
      })
      return data?.company || null
    },
  },

  sessions: {
    async list(): Promise<AuditSession[]> {
      const data = await fetchAPI<{ sessions: AuditSession[] }>(API.sessions)
      return data?.sessions || []
    },

    async create(): Promise<AuditSession | null> {
      const data = await fetchAPI<{ session: AuditSession }>(API.sessions, {
        method: 'POST',
        body: JSON.stringify({}),
      })
      return data?.session || null
    },
  },

  alerts: {
    async list(): Promise<Alert[]> {
      const data = await fetchAPI<{ alerts: Alert[] }>(API.alerts)
      return data?.alerts || []
    },

    async update(id: string, updates: Partial<Alert>): Promise<Alert | null> {
      const data = await fetchAPI<{ alert: Alert }>(API.alerts, {
        method: 'PUT',
        body: JSON.stringify({ id, ...updates }),
      })
      return data?.alert || null
    },
  },
}
