/**
 * Input sanitization utilities
 * 
 * Requirements: 3.3, 6.1 - Validate all user inputs to prevent SQL injection and XSS
 */

/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
}

/**
 * Dangerous patterns that could indicate XSS attacks
 */
const XSS_PATTERNS = [
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /on\w+\s*=/gi, // onclick=, onload=, etc.
  /<script/gi,
  /<\/script/gi,
  /<iframe/gi,
  /<object/gi,
  /<embed/gi,
  /<form/gi,
  /expression\s*\(/gi, // CSS expression
  /url\s*\(/gi, // CSS url()
]

/**
 * Strips all HTML tags from a string input
 * 
 * @param input - The string to sanitize
 * @returns The string with all HTML tags removed
 * 
 * Requirements: 3.3, 6.1
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove all HTML tags using regex
  // This handles self-closing tags, tags with attributes, and nested tags
  let result = input.replace(/<[^>]*>/g, '')
  
  // Remove dangerous patterns
  for (const pattern of XSS_PATTERNS) {
    result = result.replace(pattern, '')
  }
  
  return result.trim()
}

/**
 * Escapes HTML special characters to prevent XSS
 * Use this when you need to display user input in HTML context
 * 
 * @param input - The string to escape
 * @returns The escaped string safe for HTML display
 * 
 * Requirements: 6.1
 */
export function escapeHtml(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char)
}

/**
 * Removes potentially dangerous characters for SQL
 * Note: This is a secondary defense - always use parameterized queries
 * 
 * @param input - The string to sanitize
 * @returns The sanitized string
 * 
 * Requirements: 6.1
 */
export function sanitizeSql(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove common SQL injection patterns
  return input
    .replace(/['";\\]/g, '') // Remove quotes and backslashes
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, '') // Remove block comment end
    .replace(/\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b/gi, '')
    .trim()
}

/**
 * Sanitizes a string for safe use in URLs
 * 
 * @param input - The string to sanitize
 * @returns URL-safe string
 */
export function sanitizeUrl(input: string): string {
  if (typeof input !== 'string') return ''
  
  // Remove dangerous URL schemes
  let result = input.trim()
  
  // Check for dangerous protocols
  const dangerousProtocols = ['javascript:', 'vbscript:', 'data:', 'file:']
  const lowerInput = result.toLowerCase()
  
  for (const protocol of dangerousProtocols) {
    if (lowerInput.startsWith(protocol)) {
      return ''
    }
  }
  
  return result
}

/**
 * Sanitizes a filename to prevent path traversal attacks
 * 
 * @param filename - The filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') return ''
  
  return filename
    .replace(/\.\./g, '') // Remove path traversal
    .replace(/[\/\\]/g, '') // Remove path separators
    .replace(/[<>:"|?*]/g, '') // Remove invalid filename chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()
}

/**
 * Recursively sanitizes all string values in an object
 * 
 * @param obj - The object to sanitize
 * @returns A new object with all string values sanitized
 * 
 * Requirements: 3.3, 6.1
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  const result: Record<string, unknown> = {}
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeHtml(value)
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      result[key] = value.map(item => 
        typeof item === 'string' 
          ? sanitizeHtml(item) 
          : (item !== null && typeof item === 'object' 
              ? sanitizeObject(item as Record<string, unknown>) 
              : item)
      )
    } else {
      result[key] = value
    }
  }
  
  return result as T
}

/**
 * Validates and sanitizes an email address
 * 
 * @param email - The email to validate and sanitize
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (typeof email !== 'string') return null
  
  const sanitized = email.trim().toLowerCase()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(sanitized)) {
    return null
  }
  
  // Check for dangerous characters
  if (/[<>'"`;\\]/.test(sanitized)) {
    return null
  }
  
  return sanitized
}

/**
 * Sanitizes a phone number
 * 
 * @param phone - The phone number to sanitize
 * @returns Sanitized phone number (digits only)
 */
export function sanitizePhone(phone: string): string {
  if (typeof phone !== 'string') return ''
  
  // Keep only digits
  return phone.replace(/\D/g, '')
}

/**
 * Creates a middleware function that sanitizes request body
 */
export function sanitizeRequestBody() {
  return (req: { body: Record<string, unknown> }, res: unknown, next: () => void) => {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeObject(req.body)
    }
    next()
  }
}
