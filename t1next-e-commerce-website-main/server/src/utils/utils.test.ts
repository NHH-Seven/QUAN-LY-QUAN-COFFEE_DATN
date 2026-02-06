import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { normalizeEmail } from './email'
import { sanitizeHtml, sanitizeObject } from './sanitizer'

/**
 * Property-Based Tests for Utility Functions
 * Using fast-check library with minimum 100 iterations per property
 * 
 * **Feature: user-registration**
 */

describe('Utility Functions Property Tests', () => {
  /**
   * **Feature: user-registration, Property 2: Email Normalization**
   * 
   * *For any* valid email string with leading/trailing whitespace or uppercase characters,
   * the normalized output SHALL be trimmed and lowercase.
   * 
   * **Validates: Requirements 1.4**
   */
  describe('Property 2: Email Normalization', () => {
    // Generator for valid email base (without whitespace)
    const validEmailBaseArbitrary = fc.tuple(
      fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{1,15}$/), // Local part
      fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9]{2,10}$/), // Domain
      fc.stringMatching(/^[a-zA-Z]{2,4}$/)              // TLD
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`)

    // Generator for whitespace (spaces, tabs)
    const whitespaceArbitrary = fc.array(
      fc.constantFrom(' ', '\t'),
      { minLength: 0, maxLength: 5 }
    ).map(arr => arr.join(''))

    it('should trim leading and trailing whitespace from emails', () => {
      fc.assert(
        fc.property(
          whitespaceArbitrary,
          validEmailBaseArbitrary,
          whitespaceArbitrary,
          (leadingWs, email, trailingWs) => {
            const emailWithWhitespace = `${leadingWs}${email}${trailingWs}`
            const normalized = normalizeEmail(emailWithWhitespace)
            
            // Result should not have leading/trailing whitespace
            return normalized === normalized.trim()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should convert all uppercase characters to lowercase', () => {
      fc.assert(
        fc.property(validEmailBaseArbitrary, (email) => {
          // Create uppercase version
          const uppercaseEmail = email.toUpperCase()
          const normalized = normalizeEmail(uppercaseEmail)
          
          // Result should be all lowercase
          return normalized === normalized.toLowerCase()
        }),
        { numRuns: 100 }
      )
    })

    it('should produce consistent output regardless of input case', () => {
      fc.assert(
        fc.property(validEmailBaseArbitrary, (email) => {
          const lowercase = normalizeEmail(email.toLowerCase())
          const uppercase = normalizeEmail(email.toUpperCase())
          const mixed = normalizeEmail(email)
          
          // All variations should produce the same normalized result
          return lowercase === uppercase && uppercase === mixed
        }),
        { numRuns: 100 }
      )
    })

    it('should handle emails with mixed case and whitespace', () => {
      fc.assert(
        fc.property(
          whitespaceArbitrary,
          validEmailBaseArbitrary,
          whitespaceArbitrary,
          (leadingWs, email, trailingWs) => {
            // Create email with random case
            const mixedCaseEmail = email
              .split('')
              .map((char, i) => i % 2 === 0 ? char.toUpperCase() : char.toLowerCase())
              .join('')
            
            const emailWithWhitespace = `${leadingWs}${mixedCaseEmail}${trailingWs}`
            const normalized = normalizeEmail(emailWithWhitespace)
            
            // Result should be trimmed and lowercase
            return normalized === email.toLowerCase()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve the email structure after normalization', () => {
      fc.assert(
        fc.property(validEmailBaseArbitrary, (email) => {
          const normalized = normalizeEmail(`  ${email.toUpperCase()}  `)
          
          // Should still have exactly one @ symbol
          const atCount = (normalized.match(/@/g) || []).length
          // Should have at least one dot after @
          const domainPart = normalized.split('@')[1]
          const hasDot = domainPart && domainPart.includes('.')
          
          return atCount === 1 && hasDot
        }),
        { numRuns: 100 }
      )
    })
  })

  /**
   * **Feature: user-registration, Property 8: HTML Sanitization**
   * 
   * *For any* string input containing HTML tags, the sanitizer output SHALL not
   * contain any HTML tags.
   * 
   * **Validates: Requirements 3.3, 6.1**
   */
  describe('Property 8: HTML Sanitization', () => {
    // Generator for common HTML tags
    const htmlTagArbitrary = fc.constantFrom(
      'div', 'span', 'p', 'a', 'script', 'style', 'img', 'input',
      'button', 'form', 'table', 'tr', 'td', 'h1', 'h2', 'h3',
      'ul', 'li', 'br', 'hr', 'iframe', 'object', 'embed'
    )

    // Generator for tag attributes
    const attributeArbitrary = fc.constantFrom(
      '',
      ' class="test"',
      ' id="myId"',
      ' style="color:red"',
      ' onclick="alert(1)"',
      ' href="http://example.com"',
      ' src="image.jpg"',
      ' data-value="123"'
    )

    // Generator for plain text content (no < or > characters)
    const plainTextArbitrary = fc.string({ minLength: 0, maxLength: 50 })
      .filter(s => !s.includes('<') && !s.includes('>'))

    it('should remove all HTML tags from input', () => {
      fc.assert(
        fc.property(
          htmlTagArbitrary,
          attributeArbitrary,
          plainTextArbitrary,
          (tag, attr, content) => {
            const htmlInput = `<${tag}${attr}>${content}</${tag}>`
            const sanitized = sanitizeHtml(htmlInput)
            
            // Result should not contain any < or > characters
            return !sanitized.includes('<') && !sanitized.includes('>')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve text content between tags', () => {
      fc.assert(
        fc.property(
          htmlTagArbitrary,
          plainTextArbitrary,
          (tag, content) => {
            const htmlInput = `<${tag}>${content}</${tag}>`
            const sanitized = sanitizeHtml(htmlInput)
            
            // The content should be preserved (trimmed, as sanitizeHtml trims output)
            return sanitized === content.trim()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle self-closing tags', () => {
      const selfClosingTags = fc.constantFrom(
        '<br/>', '<br />', '<hr/>', '<hr />', 
        '<img src="test.jpg"/>', '<input type="text"/>',
        '<meta charset="utf-8"/>', '<link rel="stylesheet"/>'
      )
      
      fc.assert(
        fc.property(selfClosingTags, (tag) => {
          const sanitized = sanitizeHtml(tag)
          
          // Result should not contain any < or > characters
          return !sanitized.includes('<') && !sanitized.includes('>')
        }),
        { numRuns: 100 }
      )
    })

    it('should handle nested HTML tags', () => {
      fc.assert(
        fc.property(
          htmlTagArbitrary,
          htmlTagArbitrary,
          plainTextArbitrary,
          (outerTag, innerTag, content) => {
            const htmlInput = `<${outerTag}><${innerTag}>${content}</${innerTag}></${outerTag}>`
            const sanitized = sanitizeHtml(htmlInput)
            
            // Result should not contain any < or > characters
            // and should preserve the content (trimmed, as sanitizeHtml trims output)
            return !sanitized.includes('<') && 
                   !sanitized.includes('>') && 
                   sanitized === content.trim()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle malicious script tags', () => {
      const maliciousInputs = fc.constantFrom(
        '<script>alert("xss")</script>',
        '<script src="evil.js"></script>',
        '<SCRIPT>document.cookie</SCRIPT>',
        '<script type="text/javascript">malicious()</script>',
        '<img onerror="alert(1)" src="x">',
        '<svg onload="alert(1)">',
        '<body onload="alert(1)">',
        '<iframe src="javascript:alert(1)"></iframe>'
      )
      
      fc.assert(
        fc.property(maliciousInputs, (input) => {
          const sanitized = sanitizeHtml(input)
          
          // Result should not contain any < or > characters
          return !sanitized.includes('<') && !sanitized.includes('>')
        }),
        { numRuns: 100 }
      )
    })

    it('should handle strings without HTML tags (idempotent for plain text)', () => {
      fc.assert(
        fc.property(plainTextArbitrary, (text) => {
          const sanitized = sanitizeHtml(text)
          
          // Plain text should remain unchanged (except for trimming)
          return sanitized === text.trim()
        }),
        { numRuns: 100 }
      )
    })

    it('should handle multiple consecutive tags', () => {
      fc.assert(
        fc.property(
          fc.array(htmlTagArbitrary, { minLength: 1, maxLength: 5 }),
          fc.array(plainTextArbitrary, { minLength: 1, maxLength: 5 }),
          (tags, contents) => {
            // Build HTML with alternating tags and content
            let html = ''
            for (let i = 0; i < Math.min(tags.length, contents.length); i++) {
              html += `<${tags[i]}>${contents[i]}</${tags[i]}>`
            }
            
            const sanitized = sanitizeHtml(html)
            
            // Result should not contain any < or > characters
            return !sanitized.includes('<') && !sanitized.includes('>')
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle tags with special attributes', () => {
      fc.assert(
        fc.property(
          htmlTagArbitrary,
          plainTextArbitrary,
          (tag, content) => {
            const htmlInput = `<${tag} data-test="value" aria-label="label" role="button">${content}</${tag}>`
            const sanitized = sanitizeHtml(htmlInput)
            
            // Result should preserve content (trimmed) and remove tags
            return sanitized === content.trim()
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  /**
   * Additional tests for sanitizeObject function
   * Validates recursive sanitization of objects
   */
  describe('sanitizeObject - Recursive HTML Sanitization', () => {
    // Local generators for this describe block
    const htmlTagArb = fc.constantFrom(
      'div', 'span', 'p', 'a', 'script', 'style', 'img'
    )
    const plainTextArb = fc.string({ minLength: 0, maxLength: 30 })
      .filter(s => !s.includes('<') && !s.includes('>'))

    it('should sanitize all string values in an object', () => {
      fc.assert(
        fc.property(
          htmlTagArb,
          plainTextArb,
          plainTextArb,
          (tag, content1, content2) => {
            const obj = {
              name: `<${tag}>${content1}</${tag}>`,
              email: `<${tag}>${content2}</${tag}>`
            }
            
            const sanitized = sanitizeObject(obj)
            
            // All string values should be sanitized (trimmed, as sanitizeHtml trims output)
            return sanitized.name === content1.trim() && sanitized.email === content2.trim()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should preserve non-string values', () => {
      fc.assert(
        fc.property(
          fc.integer(),
          fc.boolean(),
          (num, bool) => {
            const obj = {
              count: num,
              active: bool,
              data: null
            }
            
            const sanitized = sanitizeObject(obj)
            
            return sanitized.count === num && 
                   sanitized.active === bool && 
                   sanitized.data === null
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
