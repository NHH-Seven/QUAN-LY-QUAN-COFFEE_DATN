/**
 * Idempotency Service
 * Prevents duplicate order submissions using idempotency keys
 * 
 * Requirements: 6.4
 * 
 * Note: This is an in-memory implementation suitable for single-server deployments.
 * For production with multiple servers, use Redis or a database table.
 */

interface IdempotencyEntry {
  orderId: string
  total: number
  status: string
  createdAt: number
}

// In-memory store for idempotency keys
// Key: `${userId}:${idempotencyKey}`, Value: order response
const idempotencyStore = new Map<string, IdempotencyEntry>()

// TTL for idempotency keys (24 hours in milliseconds)
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000

/**
 * Generate a composite key from userId and idempotencyKey
 */
function getCompositeKey(userId: string, idempotencyKey: string): string {
  return `${userId}:${idempotencyKey}`
}

/**
 * Check if an idempotency key has been used
 * Returns the stored response if found, null otherwise
 */
export function checkIdempotencyKey(
  userId: string,
  idempotencyKey: string
): IdempotencyEntry | null {
  const compositeKey = getCompositeKey(userId, idempotencyKey)
  const entry = idempotencyStore.get(compositeKey)
  
  if (!entry) {
    return null
  }
  
  // Check if entry has expired
  if (Date.now() - entry.createdAt > IDEMPOTENCY_TTL) {
    idempotencyStore.delete(compositeKey)
    return null
  }
  
  return entry
}

/**
 * Store an idempotency key with its response
 */
export function storeIdempotencyKey(
  userId: string,
  idempotencyKey: string,
  orderId: string,
  total: number,
  status: string
): void {
  const compositeKey = getCompositeKey(userId, idempotencyKey)
  
  idempotencyStore.set(compositeKey, {
    orderId,
    total,
    status,
    createdAt: Date.now()
  })
}

/**
 * Clean up expired idempotency keys
 * Should be called periodically to prevent memory leaks
 */
export function cleanupExpiredKeys(): void {
  const now = Date.now()
  
  for (const [key, entry] of idempotencyStore.entries()) {
    if (now - entry.createdAt > IDEMPOTENCY_TTL) {
      idempotencyStore.delete(key)
    }
  }
}

/**
 * Clear all idempotency keys (for testing purposes)
 */
export function clearIdempotencyStore(): void {
  idempotencyStore.clear()
}

/**
 * Get the size of the idempotency store (for monitoring/testing)
 */
export function getIdempotencyStoreSize(): number {
  return idempotencyStore.size
}

// Run cleanup every hour
setInterval(cleanupExpiredKeys, 60 * 60 * 1000)
