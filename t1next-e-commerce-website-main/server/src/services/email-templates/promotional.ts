/**
 * Promotional Email Template
 * Sent for promotions, flash sales, and marketing campaigns
 */

import {
  EmailTemplate,
  wrapInBaseTemplate,
  generateButton,
  formatPrice,
  COLORS,
  COMPANY,
} from './base'

export interface ProductPreview {
  id: string
  name: string
  image: string
  originalPrice: number
  salePrice: number
  discountPercent?: number
  url?: string
}

export interface PromotionalEmailData {
  recipientName: string
  title: string
  subtitle?: string
  description: string
  products: ProductPreview[]
  ctaText?: string
  ctaUrl: string
  expiresAt?: string
  promoCode?: string
  bannerImage?: string
  type?: 'flash_sale' | 'promotion' | 'wishlist_sale' | 'new_arrival'
}

const TYPE_CONFIG = {
  flash_sale: {
    headerColor: '#ef4444',
    icon: '⚡',
    badge: 'FLASH SALE',
    badgeColor: '#ef4444',
  },
  promotion: {
    headerColor: COLORS.primary,
    icon: '🎁',
    badge: 'KHUYẾN MÃI',
    badgeColor: COLORS.primary,
  },
  wishlist_sale: {
    headerColor: '#ec4899',
    icon: '❤️',
    badge: 'WISHLIST SALE',
    badgeColor: '#ec4899',
  },
  new_arrival: {
    headerColor: COLORS.info,
    icon: '✨',
    badge: 'MỚI VỀ',
    badgeColor: COLORS.info,
  },
}

export function promotionalTemplate(data: PromotionalEmailData): EmailTemplate {
  const {
    recipientName,
    title,
    subtitle,
    description,
    products,
    ctaText = 'Mua ngay',
    ctaUrl,
    expiresAt,
    promoCode,
    bannerImage,
    type = 'promotion',
  } = data

  const config = TYPE_CONFIG[type]

  // Generate product cards (2 per row)
  const productCards = products.map((product, index) => {
    const discountPercent = product.discountPercent || 
      Math.round((1 - product.salePrice / product.originalPrice) * 100)
    const productUrl = product.url || `${COMPANY.website}/product/${product.id}`

    return `
      <td style="width: 50%; padding: 10px; vertical-align: top;">
        <a href="${productUrl}" style="text-decoration: none; display: block;">
          <div style="background: ${COLORS.background}; border: 1px solid ${COLORS.border}; border-radius: 12px; overflow: hidden; transition: box-shadow 0.2s;">
            <div style="position: relative;">
              <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 150px; object-fit: cover;">
              <span style="position: absolute; top: 10px; left: 10px; background: ${config.badgeColor}; color: #ffffff; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: bold;">
                -${discountPercent}%
              </span>
            </div>
            <div style="padding: 12px;">
              <p style="margin: 0 0 8px 0; color: ${COLORS.textPrimary}; font-size: 13px; font-weight: 500; line-height: 1.4; height: 36px; overflow: hidden;">
                ${product.name}
              </p>
              <p style="margin: 0 0 4px 0; color: ${COLORS.textSecondary}; font-size: 12px; text-decoration: line-through;">
                ${formatPrice(product.originalPrice)}
              </p>
              <p style="margin: 0; color: ${config.badgeColor}; font-size: 16px; font-weight: bold;">
                ${formatPrice(product.salePrice)}
              </p>
            </div>
          </div>
        </a>
      </td>
    `
  })

  // Arrange products in rows of 2
  const productRows: string[] = []
  for (let i = 0; i < productCards.length; i += 2) {
    const row = `
      <tr>
        ${productCards[i]}
        ${productCards[i + 1] || '<td style="width: 50%;"></td>'}
      </tr>
    `
    productRows.push(row)
  }

  // Promo code section
  let promoCodeSection = ''
  if (promoCode) {
    promoCodeSection = `
      <div style="background: linear-gradient(135deg, ${config.headerColor}15, ${config.headerColor}05); padding: 20px; border-radius: 8px; margin: 25px 0; text-align: center; border: 2px dashed ${config.headerColor};">
        <p style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px;">
          Sử dụng mã giảm giá:
        </p>
        <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${config.headerColor}; letter-spacing: 3px; font-family: 'Courier New', monospace;">
          ${promoCode}
        </p>
      </div>
    `
  }

  // Countdown/expiry section
  let expirySection = ''
  if (expiresAt) {
    expirySection = `
      <div style="background: ${COLORS.error}10; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0; color: ${COLORS.error}; font-size: 14px; font-weight: 500;">
          ⏰ Ưu đãi kết thúc: <strong>${expiresAt}</strong>
        </p>
      </div>
    `
  }

  const content = `
    ${bannerImage ? `
      <div style="margin: -30px -40px 25px -40px;">
        <img src="${bannerImage}" alt="${title}" style="width: 100%; max-height: 200px; object-fit: cover;">
      </div>
    ` : ''}

    <p style="font-size: 16px; color: ${COLORS.textPrimary}; margin: 0 0 20px 0;">
      Xin chào <strong>${recipientName}</strong>,
    </p>
    
    ${subtitle ? `
      <p style="font-size: 14px; color: ${config.headerColor}; font-weight: 600; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">
        ${config.icon} ${subtitle}
      </p>
    ` : ''}

    <p style="font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; margin: 0 0 25px 0;">
      ${description}
    </p>

    ${promoCodeSection}
    ${expirySection}

    ${products.length > 0 ? `
      <p style="font-size: 16px; color: ${COLORS.textPrimary}; font-weight: 600; margin: 25px 0 15px 0;">
        🔥 Sản phẩm nổi bật
      </p>
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        ${productRows.join('')}
      </table>
    ` : ''}

    ${generateButton(ctaText, ctaUrl, config.headerColor)}

    <p style="font-size: 13px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
      Đừng bỏ lỡ cơ hội sở hữu sản phẩm yêu thích với giá ưu đãi!
    </p>
  `

  const html = wrapInBaseTemplate(content, {
    title: `${config.icon} ${title}`,
    preheader: subtitle || description.substring(0, 100),
    headerColor: config.headerColor,
  })

  // Plain text version
  const productsText = products.map(p => {
    const discountPercent = p.discountPercent || Math.round((1 - p.salePrice / p.originalPrice) * 100)
    return `- ${p.name}\n  Giá gốc: ${formatPrice(p.originalPrice)} → Giá sale: ${formatPrice(p.salePrice)} (-${discountPercent}%)`
  }).join('\n\n')

  const text = `
${config.badge}: ${title}

Xin chào ${recipientName},

${description}

${promoCode ? `Mã giảm giá: ${promoCode}` : ''}
${expiresAt ? `⏰ Ưu đãi kết thúc: ${expiresAt}` : ''}

SẢN PHẨM NỔI BẬT
----------------
${productsText}

${ctaText}: ${ctaUrl}

---
${COMPANY.name} - ${COMPANY.tagline}
Hotline: ${COMPANY.hotline}
Email: ${COMPANY.email}

Để hủy đăng ký nhận email khuyến mãi, vui lòng truy cập: ${COMPANY.website}/profile/notifications
  `.trim()

  return {
    subject: `${config.icon} ${title} - ${COMPANY.name}`,
    html,
    text,
  }
}
