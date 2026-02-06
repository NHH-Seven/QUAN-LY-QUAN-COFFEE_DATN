import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { 
  loadCompareFromStorage, 
  saveCompareToStorage, 
  MAX_COMPARE_ITEMS 
} from './compare-context'

/**
 * Property-Based Tests for Compare List Operations
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: customer-features**
 */

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} }
  }
})()

// Setup localStorage mock before tests
beforeEach(() => {
  localStorageMock.clear()
  Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true })
})

/**
 * Pure function to simulate addToCompare logic
 * Returns new list after attempting to add productId
 */
function addToCompareList(list: string[], productId: string): string[] {
  if (list.includes(productId)) return list
  if (list.length >= MAX_COMPARE_ITEMS) return list
  return [...list, productId]
}

/**
 * Pure function to simulate removeFromCompare logic
 */
function removeFromCompareList(list: string[], productId: string): string[] {
  return list.filter(id => id !== productId)
}

describe('Compare List Property Tests', () => {
  /**
   * **Feature: customer-features, Property 4: Compare List Max Limit**
   * 
   * *For any* sequence of add operations to compare list, the list size 
   * SHALL never exceed 4 products.
   * 
   * **Validates: Requirements 2.2**
   */
  describe('Property 4: Compare List Max Limit', () => {
    it('should never exceed MAX_COMPARE_ITEMS regardless of add operations', () => {
      // Generator for a sequence of product IDs to add
      const productIdArb = fc.uuid()
      const addOperationsArb = fc.array(productIdArb, { minLength: 1, maxLength: 20 })

      fc.assert(
        fc.property(addOperationsArb, (productIds) => {
          let list: string[] = []
          
          // Apply all add operations
          for (const productId of productIds) {
            list = addToCompareList(list, productId)
          }
          
          // List should never exceed MAX_COMPARE_ITEMS
          return list.length <= MAX_COMPARE_ITEMS
        }),
        { numRuns: 100 }
      )
    })

    it('should stop adding when max limit is reached', () => {
      // Generate exactly MAX_COMPARE_ITEMS + extra unique IDs
      const uniqueIdsArb = fc.uniqueArray(fc.uuid(), { 
        minLength: MAX_COMPARE_ITEMS + 1, 
        maxLength: MAX_COMPARE_ITEMS + 5 
      })

      fc.assert(
        fc.property(uniqueIdsArb, (productIds) => {
          let list: string[] = []
          
          // Add all products
          for (const productId of productIds) {
            list = addToCompareList(list, productId)
          }
          
          // Should be exactly MAX_COMPARE_ITEMS
          return list.length === MAX_COMPARE_ITEMS
        }),
        { numRuns: 100 }
      )
    })

    it('should not add duplicate products', () => {
      const productIdArb = fc.uuid()

      fc.assert(
        fc.property(productIdArb, (productId) => {
          let list: string[] = []
          
          // Add same product multiple times
          list = addToCompareList(list, productId)
          list = addToCompareList(list, productId)
          list = addToCompareList(list, productId)
          
          // Should only have 1 item
          return list.length === 1 && list[0] === productId
        }),
        { numRuns: 100 }
      )
    })

    it('should maintain max limit after mixed add/remove operations', () => {
      const operationArb = fc.oneof(
        fc.record({ type: fc.constant('add' as const), productId: fc.uuid() }),
        fc.record({ type: fc.constant('remove' as const), productId: fc.uuid() })
      )
      const operationsArb = fc.array(operationArb, { minLength: 1, maxLength: 30 })

      fc.assert(
        fc.property(operationsArb, (operations) => {
          let list: string[] = []
          
          for (const op of operations) {
            if (op.type === 'add') {
              list = addToCompareList(list, op.productId)
            } else {
              list = removeFromCompareList(list, op.productId)
            }
          }
          
          return list.length <= MAX_COMPARE_ITEMS
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: customer-features, Property 6: Compare List Persistence**
   * 
   * *For any* compare list state, saving to localStorage then reading back 
   * SHALL produce an equivalent list.
   * 
   * **Validates: Requirements 2.6**
   */
  describe('Property 6: Compare List Persistence', () => {
    it('should persist and restore compare list correctly', () => {
      // Generator for valid compare lists (max 4 unique product IDs)
      const compareListArb = fc.uniqueArray(fc.uuid(), { 
        minLength: 0, 
        maxLength: MAX_COMPARE_ITEMS 
      })

      fc.assert(
        fc.property(compareListArb, (originalList) => {
          // Save to localStorage
          saveCompareToStorage(originalList)
          
          // Load from localStorage
          const loadedList = loadCompareFromStorage()
          
          // Should be equivalent
          return (
            loadedList.length === originalList.length &&
            originalList.every((id, index) => loadedList[index] === id)
          )
        }),
        { numRuns: 100 }
      )
    })

    it('should return empty array for empty localStorage', () => {
      localStorageMock.clear()
      const loaded = loadCompareFromStorage()
      expect(loaded).toEqual([])
    })

    it('should return empty array for invalid JSON in localStorage', () => {
      localStorageMock.setItem('nhh-coffee-compare', 'invalid json {{{')
      const loaded = loadCompareFromStorage()
      expect(loaded).toEqual([])
    })

    it('should return empty array for non-array data in localStorage', () => {
      localStorageMock.setItem('nhh-coffee-compare', JSON.stringify({ not: 'an array' }))
      const loaded = loadCompareFromStorage()
      expect(loaded).toEqual([])
    })

    it('should truncate list to MAX_COMPARE_ITEMS if localStorage has more', () => {
      // Manually save more than MAX_COMPARE_ITEMS
      const oversizedList = Array.from({ length: 10 }, (_, i) => `product-${i}`)
      localStorageMock.setItem('nhh-coffee-compare', JSON.stringify(oversizedList))
      
      const loaded = loadCompareFromStorage()
      expect(loaded.length).toBe(MAX_COMPARE_ITEMS)
      expect(loaded).toEqual(oversizedList.slice(0, MAX_COMPARE_ITEMS))
    })

    it('should handle round-trip with various list sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: MAX_COMPARE_ITEMS }),
          (size) => {
            const list = Array.from({ length: size }, (_, i) => `product-${i}`)
            
            saveCompareToStorage(list)
            const loaded = loadCompareFromStorage()
            
            return loaded.length === size && 
                   list.every((id, idx) => loaded[idx] === id)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
