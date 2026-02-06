/**
 * Email Template Base
 * Provides reusable header/footer components and styling for all email templates
 * Supports both light and dark mode with inline styles
 */

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export interface BaseTemplateConfig {
  title: string
  preheader?: string
  headerColor?: string
  headerGradient?: boolean
}

// Brand colors
const COLORS = {
  primary: '#14b8a6',
  primaryDark: '#0d9488',
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  background: '#ffffff',
  backgroundAlt: '#f9fafb',
  border: '#e5e7eb',
}

// Company info
const COMPANY = {
  name: 'NHH-Coffee',
  tagline: 'Cửa hàng cà phê & trà',
  hotline: '0762393111',
  email: 'support@nhh-coffee.com',
  address: 'Hải Thịnh, Tỉnh Ninh Bình',
  website: process.env.CLIENT_URL || 'http://localhost:3000',
  logoUrl: `${process.env.CLIENT_URL || 'http://localhost:3000'}/logo.svg`,
}

/**
 * Generate email header with logo and title
 */
export function generateHeader(config: BaseTemplateConfig): string {
  const bgStyle = config.headerGradient !== false
    ? `background: linear-gradient(135deg, ${config.headerColor || COLORS.primary}, ${COLORS.primaryDark});`
    : `background: ${config.headerColor || COLORS.primary};`

  return `
    <tr>
      <td style="${bgStyle} padding: 30px 20px; text-align: center;">
        <img src="${COMPANY.logoUrl}" alt="${COMPANY.name}" style="height: 40px; margin-bottom: 15px;" onerror="this.style.display='none'">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">
          ${config.title}
        </h1>
        ${config.preheader ? `<p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">${config.preheader}</p>` : ''}
      </td>
    </tr>
  `
}

/**
 * Generate email footer with contact info and social links
 */
export function generateFooter(): string {
  return `
    <tr>
      <td style="background: ${COLORS.backgroundAlt}; padding: 30px 20px; text-align: center;">
        <p style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px;">
          Cần hỗ trợ? Liên hệ hotline: <strong style="color: ${COLORS.primary};">${COMPANY.hotline}</strong>
        </p>
        <p style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px;">
          Email: <a href="mailto:${COMPANY.email}" style="color: ${COLORS.primary}; text-decoration: none;">${COMPANY.email}</a>
        </p>
        <p style="margin: 0 0 20px 0; color: ${COLORS.textSecondary}; font-size: 12px;">
          ${COMPANY.address}
        </p>
        <div style="border-top: 1px solid ${COLORS.border}; padding-top: 20px; margin-top: 10px;">
          <p style="margin: 0 0 5px 0; color: ${COLORS.textSecondary}; font-size: 12px;">
            <strong>${COMPANY.name}</strong> - ${COMPANY.tagline}
          </p>
          <p style="margin: 0; color: ${COLORS.textSecondary}; font-size: 11px;">
            © ${new Date().getFullYear()} ${COMPANY.name}. All rights reserved.
          </p>
        </div>
      </td>
    </tr>
  `
}

/**
 * Wrap content in base email layout
 */
export function wrapInBaseTemplate(
  content: string,
  config: BaseTemplateConfig
): string {
  return `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${config.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .email-body {
        background-color: #1f2937 !important;
      }
      .email-container {
        background-color: #111827 !important;
      }
      .content-cell {
        background-color: #111827 !important;
        color: #f3f4f6 !important;
      }
      .text-primary {
        color: #f3f4f6 !important;
      }
      .text-secondary {
        color: #9ca3af !important;
      }
      .bg-alt {
        background-color: #1f2937 !important;
      }
      .info-box {
        background-color: #1f2937 !important;
        border-color: #374151 !important;
      }
    }
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    /* Responsive */
    @media only screen and (max-width: 600px) {
      .email-container {
        width: 100% !important;
        max-width: 100% !important;
      }
      .mobile-padding {
        padding-left: 15px !important;
        padding-right: 15px !important;
      }
      .mobile-stack {
        display: block !important;
        width: 100% !important;
      }
    }
  </style>
</head>
<body class="email-body" style="margin: 0; padding: 0; background-color: ${COLORS.backgroundAlt}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preview text -->
  <div style="display: none; max-height: 0; overflow: hidden;">
    ${config.preheader || config.title}
    &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${COLORS.backgroundAlt};">
    <tr>
      <td style="padding: 20px 10px;">
        <table class="email-container" role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; background-color: ${COLORS.background}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          ${generateHeader(config)}
          <tr>
            <td class="content-cell mobile-padding" style="padding: 30px 40px; background-color: ${COLORS.background}; color: ${COLORS.textPrimary};">
              ${content}
            </td>
          </tr>
          ${generateFooter()}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}


/**
 * Generate a CTA button
 */
export function generateButton(
  text: string,
  url: string,
  color: string = COLORS.primary
): string {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 25px auto;">
      <tr>
        <td style="border-radius: 8px; background: ${color};">
          <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `
}

/**
 * Generate an info box
 */
export function generateInfoBox(
  content: string,
  borderColor: string = COLORS.primary
): string {
  return `
    <div class="info-box" style="background: ${COLORS.backgroundAlt}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
      ${content}
    </div>
  `
}

/**
 * Generate a section title
 */
export function generateSectionTitle(title: string, emoji?: string): string {
  return `
    <h3 style="color: ${COLORS.textPrimary}; border-bottom: 2px solid ${COLORS.primary}; padding-bottom: 10px; margin: 25px 0 15px 0; font-size: 16px;">
      ${emoji ? `${emoji} ` : ''}${title}
    </h3>
  `
}

/**
 * Generate a warning/alert box
 */
export function generateAlert(
  message: string,
  type: 'warning' | 'error' | 'success' | 'info' = 'warning'
): string {
  const colorMap = {
    warning: { bg: '#fef3c7', border: COLORS.warning, icon: '⚠️' },
    error: { bg: '#fee2e2', border: COLORS.error, icon: '❌' },
    success: { bg: '#dcfce7', border: COLORS.success, icon: '✅' },
    info: { bg: '#dbeafe', border: COLORS.info, icon: 'ℹ️' },
  }
  const style = colorMap[type]

  return `
    <div style="background: ${style.bg}; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid ${style.border};">
      <p style="margin: 0; color: ${COLORS.textPrimary}; font-size: 14px;">
        ${style.icon} ${message}
      </p>
    </div>
  `
}

/**
 * Format price in VND
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

/**
 * Format date in Vietnamese
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Generate plain text version from HTML
 */
export function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&zwnj;/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Export colors and company info for use in other templates
export { COLORS, COMPANY }
