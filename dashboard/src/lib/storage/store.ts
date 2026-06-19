import fs from 'fs'
import path from 'path'
import type {
  Company,
  PlatformUser,
  AuditSession,
  AuditFinding,
  Alert,
  FinancialRecord,
} from '@shared/types/entities'
import { encrypt, decrypt, generateUUID, hashIntegrity } from '../security/crypto'

const DATA_DIR = path.join(process.cwd(), 'data')

const PATHS = {
  companies: path.join(DATA_DIR, 'companies'),
  users: path.join(DATA_DIR, 'users'),
  sessions: path.join(DATA_DIR, 'sessions'),
  alerts: path.join(DATA_DIR, 'alerts'),
  records: path.join(DATA_DIR, 'records'),
  config: path.join(DATA_DIR, 'config.json'),
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function readFile<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeFile(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

function readEncrypted<T>(filePath: string): T | null {
  try {
    if (!fs.existsSync(filePath)) return null
    const raw = fs.readFileSync(filePath, 'utf-8')
    const decrypted = decrypt(raw)
    return JSON.parse(decrypted) as T
  } catch {
    return null
  }
}

function writeEncrypted(filePath: string, data: unknown): void {
  ensureDir(path.dirname(filePath))
  const json = JSON.stringify(data)
  const encrypted = encrypt(json)
  fs.writeFileSync(filePath, encrypted, 'utf-8')
}

function listFiles(dir: string): string[] {
  try {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir).filter(f => f.endsWith('.json') || f.endsWith('.enc'))
  } catch {
    return []
  }
}

export const storage = {
  companies: {
    create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Company {
      const now = new Date().toISOString()
      const company: Company = {
        ...data,
        id: generateUUID(),
        createdAt: now,
        updatedAt: now,
      }
      writeEncrypted(path.join(PATHS.companies, `${company.id}.enc`), company)
      return company
    },

    getById(id: string): Company | null {
      return readEncrypted<Company>(path.join(PATHS.companies, `${id}.enc`))
    },

    getByRut(rut: string): Company | null {
      const files = listFiles(PATHS.companies)
      for (const file of files) {
        const company = readEncrypted<Company>(path.join(PATHS.companies, file))
        if (company && company.rut === rut) return company
      }
      return null
    },

    update(id: string, data: Partial<Company>): Company | null {
      const company = this.getById(id)
      if (!company) return null
      const updated: Company = {
        ...company,
        ...data,
        id: company.id,
        createdAt: company.createdAt,
        updatedAt: new Date().toISOString(),
      }
      writeEncrypted(path.join(PATHS.companies, `${id}.enc`), updated)
      return updated
    },

    list(): Company[] {
      const files = listFiles(PATHS.companies)
      return files
        .map(f => readEncrypted<Company>(path.join(PATHS.companies, f)))
        .filter((c): c is Company => c !== null)
    },

    delete(id: string): boolean {
      const filePath = path.join(PATHS.companies, `${id}.enc`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        return true
      }
      return false
    },
  },

  users: {
    create(data: Omit<PlatformUser, 'id' | 'createdAt' | 'updatedAt'>): PlatformUser {
      const now = new Date().toISOString()
      const user: PlatformUser = {
        ...data,
        id: generateUUID(),
        createdAt: now,
        updatedAt: now,
      }
      writeEncrypted(path.join(PATHS.users, `${user.id}.enc`), user)
      return user
    },

    getById(id: string): PlatformUser | null {
      return readEncrypted<PlatformUser>(path.join(PATHS.users, `${id}.enc`))
    },

    getByEmail(email: string): PlatformUser | null {
      const files = listFiles(PATHS.users)
      for (const file of files) {
        const user = readEncrypted<PlatformUser>(path.join(PATHS.users, file))
        if (user && user.email.toLowerCase() === email.toLowerCase()) return user
      }
      return null
    },

    listByCompany(companyId: string): PlatformUser[] {
      const files = listFiles(PATHS.users)
      return files
        .map(f => readEncrypted<PlatformUser>(path.join(PATHS.users, f)))
        .filter((u): u is PlatformUser => u !== null && u.companyId === companyId)
    },

    update(id: string, data: Partial<PlatformUser>): PlatformUser | null {
      const user = this.getById(id)
      if (!user) return null
      const updated: PlatformUser = {
        ...user,
        ...data,
        id: user.id,
        createdAt: user.createdAt,
        updatedAt: new Date().toISOString(),
      }
      writeEncrypted(path.join(PATHS.users, `${id}.enc`), updated)
      return updated
    },

    delete(id: string): boolean {
      const filePath = path.join(PATHS.users, `${id}.enc`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        return true
      }
      return false
    },
  },

  sessions: {
    create(data: Omit<AuditSession, 'id' | 'createdAt'>): AuditSession {
      const session: AuditSession = {
        ...data,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
      }
      writeFile(path.join(PATHS.sessions, `${session.id}.json`), session)
      return session
    },

    getById(id: string): AuditSession | null {
      return readFile<AuditSession>(path.join(PATHS.sessions, `${id}.json`))
    },

    listByCompany(companyId: string): AuditSession[] {
      const files = listFiles(PATHS.sessions)
      return files
        .map(f => readFile<AuditSession>(path.join(PATHS.sessions, f)))
        .filter((s): s is AuditSession => s !== null && s.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    update(id: string, data: Partial<AuditSession>): AuditSession | null {
      const session = this.getById(id)
      if (!session) return null
      const updated: AuditSession = { ...session, ...data, id: session.id }
      writeFile(path.join(PATHS.sessions, `${id}.json`), updated)
      return updated
    },

    delete(id: string): boolean {
      const filePath = path.join(PATHS.sessions, `${id}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        return true
      }
      return false
    },

    addFinding(sessionId: string, finding: AuditFinding): AuditSession | null {
      const session = this.getById(sessionId)
      if (!session) return null
      session.findings.push(finding)
      writeFile(path.join(PATHS.sessions, `${sessionId}.json`), session)
      return session
    },
  },

  alerts: {
    create(data: Omit<Alert, 'id' | 'createdAt'>): Alert {
      const alert: Alert = {
        ...data,
        id: generateUUID(),
        createdAt: new Date().toISOString(),
      }
      writeFile(path.join(PATHS.alerts, `${alert.id}.json`), alert)
      return alert
    },

    getById(id: string): Alert | null {
      return readFile<Alert>(path.join(PATHS.alerts, `${id}.json`))
    },

    listByCompany(companyId: string): Alert[] {
      const files = listFiles(PATHS.alerts)
      return files
        .map(f => readFile<Alert>(path.join(PATHS.alerts, f)))
        .filter((a): a is Alert => a !== null && a.companyId === companyId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    },

    listActive(companyId: string): Alert[] {
      return this.listByCompany(companyId).filter(a => a.status === 'active')
    },

    update(id: string, data: Partial<Alert>): Alert | null {
      const alert = this.getById(id)
      if (!alert) return null
      const updated: Alert = { ...alert, ...data, id: alert.id }
      writeFile(path.join(PATHS.alerts, `${id}.json`), updated)
      return updated
    },
  },

  records: {
    create(data: Omit<FinancialRecord, 'id' | 'createdAt' | 'hash'>): FinancialRecord {
      const record: FinancialRecord = {
        ...data,
        id: generateUUID(),
        hash: hashIntegrity(data),
        createdAt: new Date().toISOString(),
      }
      writeFile(path.join(PATHS.records, `${record.id}.json`), record)
      return record
    },

    listBySession(sessionId: string): FinancialRecord[] {
      const files = listFiles(PATHS.records)
      return files
        .map(f => readFile<FinancialRecord>(path.join(PATHS.records, f)))
        .filter((r): r is FinancialRecord => r !== null && r.sessionId === sessionId)
    },

    listByCompany(companyId: string): FinancialRecord[] {
      const files = listFiles(PATHS.records)
      return files
        .map(f => readFile<FinancialRecord>(path.join(PATHS.records, f)))
        .filter((r): r is FinancialRecord => r !== null && r.companyId === companyId)
    },
  },

  config: {
    get(): Record<string, unknown> {
      return readFile<Record<string, unknown>>(PATHS.config) || {}
    },

    set(key: string, value: unknown): void {
      const config = this.get()
      config[key] = value
      writeFile(PATHS.config, config)
    },

    getKey<T>(key: string): T | null {
      const config = this.get()
      return (config[key] as T) || null
    },
  },
}
