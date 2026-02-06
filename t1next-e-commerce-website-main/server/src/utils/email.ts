/**
 * Email utility functions
 * 
 * Requirements: 1.4
 */

/**
 * Normalizes an email address by:
 * - Trimming leading/trailing whitespace
 * - Converting to lowercase
 * 
 * @param email - The email address to normalize
 * @returns The normalized email address
 * 
 * Requirements: 1.4
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}
