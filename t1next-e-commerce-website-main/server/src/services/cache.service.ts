import Redis from 'ioredis'
import { config } from '../config/index.js'

// Cache keys pattern
export const CACHE_KEYS = {
  PRODUCTS_LIST: 'products:list',
  PRODUCT_DETAIL: (slug: string) => `product:${slug}`,
  CATEGORIES: 'categories:all',
  CATEGORY_PRODUCTS: (slug: string) => `category:${slug}:products`,
  USER_CART: (userId: string) => `cart:${userId}`,
  FLASH_SALES: 'flash-sales:active',
}

// TTL configuration (seconds)
export const CACHE_TTL = {
  PRODUCTS_LIST: 300,      // 5 minutes
  PRODUCT_DETAIL: 600,     // 10 minutes
  CATEGORIES: 3600,        // 1 hour
  FLASH_SALES: 60,         // 1 minute
}

// In-memory cache fallback
interface MemoryCacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache {
  private cache: Map<string, MemoryCacheEntry<unknown>> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as MemoryCacheEntry<T> | undefined
    if (!entry) return null
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }
    
    return entry.value
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    })
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async delPattern(pattern: string): Promise<void> {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  async flush(): Promise<void> {
    this.cache.clear()
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.cache.clear()
  }
}

// Cache service interface
export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>
  del(key: string): Promise<void>
  delPattern(pattern: string): Promise<void>
  flush(): Promise<void>
  isConnected(): boolean
  disconnect(): Promise<void>
}

// Redis cache implementation
class RedisCacheService implements CacheService {
  private client: Redis | null = null
  private connected: boolean = false
  private memoryFallback: MemoryCache
  private useMemoryFallback: boolean = false

  constructor() {
    this.memoryFallback = new MemoryCache()
    this.initRedis()
  }

  private initRedis(): void {
    const redisUrl = config.redis?.url

    if (!redisUrl) {
      console.log('Redis URL not configured, using in-memory cache')
      this.useMemoryFallback = true
      return
    }

    try {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('Redis connection failed, falling back to in-memory cache')
            this.useMemoryFallback = true
            return null // Stop retrying
          }
          return Math.min(times * 100, 3000)
        },
        lazyConnect: true,
      })

      this.client.on('connect', () => {
        console.log('Redis connected')
        this.connected = true
        this.useMemoryFallback = false
      })

      this.client.on('error', (err) => {
        console.error('Redis error:', err.message)
        if (!this.useMemoryFallback) {
          console.log('Switching to in-memory cache fallback')
          this.useMemoryFallback = true
        }
      })

      this.client.on('close', () => {
        console.log('Redis connection closed')
        this.connected = false
      })

      // Attempt connection
      this.client.connect().catch((err) => {
        console.warn('Redis initial connection failed:', err.message)
        this.useMemoryFallback = true
      })
    } catch (err) {
      console.warn('Redis initialization failed:', err)
      this.useMemoryFallback = true
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.useMemoryFallback || !this.client) {
      return this.memoryFallback.get<T>(key)
    }

    try {
      const data = await this.client.get(key)
      if (!data) return null
      return JSON.parse(data) as T
    } catch (err) {
      console.error('Redis get error:', err)
      return this.memoryFallback.get<T>(key)
    }
  }

  async set<T>(key: string, value: T, ttlSeconds: number = 300): Promise<void> {
    const serialized = JSON.stringify(value)

    if (this.useMemoryFallback || !this.client) {
      await this.memoryFallback.set(key, value, ttlSeconds)
      return
    }

    try {
      await this.client.setex(key, ttlSeconds, serialized)
    } catch (err) {
      console.error('Redis set error:', err)
      await this.memoryFallback.set(key, value, ttlSeconds)
    }
  }

  async del(key: string): Promise<void> {
    await this.memoryFallback.del(key)

    if (this.useMemoryFallback || !this.client) return

    try {
      await this.client.del(key)
    } catch (err) {
      console.error('Redis del error:', err)
    }
  }

  async delPattern(pattern: string): Promise<void> {
    await this.memoryFallback.delPattern(pattern)

    if (this.useMemoryFallback || !this.client) return

    try {
      const keys = await this.client.keys(pattern)
      if (keys.length > 0) {
        await this.client.del(...keys)
      }
    } catch (err) {
      console.error('Redis delPattern error:', err)
    }
  }

  async flush(): Promise<void> {
    await this.memoryFallback.flush()

    if (this.useMemoryFallback || !this.client) return

    try {
      await this.client.flushdb()
    } catch (err) {
      console.error('Redis flush error:', err)
    }
  }

  isConnected(): boolean {
    return this.connected && !this.useMemoryFallback
  }

  async disconnect(): Promise<void> {
    this.memoryFallback.destroy()
    
    if (this.client) {
      await this.client.quit()
      this.client = null
    }
    this.connected = false
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null

export function getCacheService(): CacheService {
  if (!cacheInstance) {
    cacheInstance = new RedisCacheService()
  }
  return cacheInstance
}

// Helper functions for common cache operations
export async function cacheGet<T>(key: string): Promise<T | null> {
  return getCacheService().get<T>(key)
}

export async function cacheSet<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
  return getCacheService().set(key, value, ttlSeconds)
}

export async function cacheDel(key: string): Promise<void> {
  return getCacheService().del(key)
}

export async function cacheDelPattern(pattern: string): Promise<void> {
  return getCacheService().delPattern(pattern)
}

// Invalidation helpers
export async function invalidateProductCache(slug?: string): Promise<void> {
  const cache = getCacheService()
  await cache.del(CACHE_KEYS.PRODUCTS_LIST)
  if (slug) {
    await cache.del(CACHE_KEYS.PRODUCT_DETAIL(slug))
  }
  await cache.delPattern('category:*:products')
}

export async function invalidateCategoryCache(slug?: string): Promise<void> {
  const cache = getCacheService()
  await cache.del(CACHE_KEYS.CATEGORIES)
  if (slug) {
    await cache.del(CACHE_KEYS.CATEGORY_PRODUCTS(slug))
  }
}

export async function invalidateFlashSaleCache(): Promise<void> {
  const cache = getCacheService()
  await cache.del(CACHE_KEYS.FLASH_SALES)
}
