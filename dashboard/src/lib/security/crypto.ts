import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_BYTES = 32
const IV_BYTES = 16
const AUTH_TAG_BYTES = 16
const SALT_BYTES = 32
const PBKDF2_ITERATIONS = 100000

function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, 'sha256')
}

function getMasterKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.NEXT_PUBLIC_APP_SECRET || 'sii-scrapper-default-key-change-in-production-2024'
  if (key.length < 32) {
    return key.padEnd(32, '0')
  }
  return key
}

export function encrypt(plaintext: string): string {
  const masterKey = getMasterKey()
  const salt = crypto.randomBytes(SALT_BYTES)
  const key = deriveKey(masterKey, salt)
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  const combined = Buffer.concat([salt, iv, authTag, encrypted])
  return combined.toString('base64')
}

export function decrypt(encoded: string): string {
  const masterKey = getMasterKey()
  const combined = Buffer.from(encoded, 'base64')
  const salt = combined.subarray(0, SALT_BYTES)
  const iv = combined.subarray(SALT_BYTES, SALT_BYTES + IV_BYTES)
  const authTag = combined.subarray(SALT_BYTES + IV_BYTES, SALT_BYTES + IV_BYTES + AUTH_TAG_BYTES)
  const encrypted = combined.subarray(SALT_BYTES + IV_BYTES + AUTH_TAG_BYTES)
  const key = deriveKey(masterKey, salt)
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':')
  const computed = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, KEY_BYTES, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computed))
}

export function generateUUID(): string {
  return crypto.randomUUID()
}

export function generateToken(length = 48): string {
  return crypto.randomBytes(length).toString('hex')
}

export function sha256Hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex')
}

export function hashIntegrity(data: unknown): string {
  return sha256Hash(JSON.stringify(data))
}
