/**
 * Email Templates Module
 * Exports all email templates and utilities
 */

// Base template utilities
export {
  type EmailTemplate,
  type BaseTemplateConfig,
  wrapInBaseTemplate,
  generateHeader,
  generateFooter,
  generateButton,
  generateInfoBox,
  generateSectionTitle,
  generateAlert,
  formatPrice,
  formatDate,
  htmlToPlainText,
  COLORS,
  COMPANY,
} from './base'

// Individual templates
export { welcomeTemplate, type WelcomeEmailData } from './welcome'
export { orderConfirmationTemplate, type OrderConfirmationData } from './order-confirmation'
export { orderStatusTemplate, type OrderStatusData } from './order-status'
export { passwordResetTemplate, type PasswordResetData } from './password-reset'
export { promotionalTemplate, type PromotionalEmailData, type ProductPreview } from './promotional'
