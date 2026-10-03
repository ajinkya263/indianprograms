import crypto from 'crypto'

/**
 * Symmetric encryption for sensitive data (OAuth tokens, refresh tokens, etc.)
 *
 * Uses AES-256-GCM which provides both confidentiality and authenticity.
 * Format: base64(iv + authTag + ciphertext)
 *
 * SECURITY:
 * - The ENCRYPTION_KEY env var MUST be set in production (32 bytes, base64).
 * - If the key is rotated, all encrypted data becomes unreadable.
 * - Never log decrypted values.
 * - Only decrypt server-side; never expose the key to the client.
 *
 * To generate a new key:
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12 // GCM standard
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const keyB64 = process.env.ENCRYPTION_KEY
  if (!keyB64) {
    throw new Error('ENCRYPTION_KEY env var is not set. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'base64\'))"')
  }
  const key = Buffer.from(keyB64, 'base64')
  if (key.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (base64 encoded)')
  }
  return key
}

/**
 * Encrypt a plaintext string. Returns base64 encoded ciphertext.
 * Empty strings return empty (no need to encrypt).
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''

  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // Combined format: IV (12) + AuthTag (16) + Ciphertext
  const combined = Buffer.concat([iv, authTag, ciphertext])
  return combined.toString('base64')
}

/**
 * Decrypt a base64 encoded ciphertext. Returns the original plaintext.
 * Throws if the data was tampered with or the wrong key is used.
 */
export function decrypt(encrypted: string): string {
  if (!encrypted) return ''

  const key = getKey()
  const combined = Buffer.from(encrypted, 'base64')

  if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('Encrypted value is too short')
  }

  const iv = combined.subarray(0, IV_LENGTH)
  const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return plaintext.toString('utf8')
}

/**
 * Mask a sensitive value for display (shows first 4 and last 4 chars).
 * Used for showing tokens in UI without revealing the full value.
 */
export function maskValue(value: string): string {
  if (!value) return ''
  if (value.length <= 8) return '••••••••'
  return `${value.substring(0, 4)}••••${value.substring(value.length - 4)}`
}
