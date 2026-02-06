/**
 * Order Status Update Email Template
 * Sent when order status changes (confirmed, shipping, delivered, cancelled)
 */

import {
  EmailTemplate,
  wrapInBaseTemplate,
  generateButton,
  generateInfoBox,
  generateAlert,
  COLORS,
  COMPANY,
} from './base'

export interface OrderStatusData {
  orderId: string
  recipientName: string
  status: 'confirmed' | 'shipping' | 'delivered' | 'cancelled' | 'returned'
  trackingNumber?: string
  trackingUrl?: string
  carrier?: string
  estimatedDelivery?: string
  cancelReason?: string
  refundAmount?: number
}

interface StatusConfig {
  label: string
  color: string
  icon: string
  title: string
  message: string
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  confirmed: {
    label: 'Đã xác nhận',
    color: COLORS.success,
    icon: '✅',
    title: 'Đơn hàng đã được xác nhận!',
    message: 'Đơn hàng của bạn đã được xác nhận và đang được chuẩn bị. Chúng tôi sẽ thông báo khi đơn hàng được giao cho đơn vị vận chuyển.',
  },
  shipping: {
    label: 'Đang giao hàng',
    color: COLORS.info,
    icon: '🚚',
    title: 'Đơn hàng đang trên đường giao!',
    message: 'Đơn hàng của bạn đã được giao cho đơn vị vận chuyển và đang trên đường đến bạn.',
  },
  delivered: {
    label: 'Đã giao hàng',
    color: COLORS.primary,
    icon: '🎉',
    title: 'Đơn hàng đã giao thành công!',
    message: 'Đơn hàng của bạn đã được giao thành công. Cảm ơn bạn đã đặt hàng tại NHH-Coffee!',
  },
  cancelled: {
    label: 'Đã hủy',
    color: COLORS.error,
    icon: '❌',
    title: 'Đơn hàng đã bị hủy',
    message: 'Đơn hàng của bạn đã bị hủy theo yêu cầu.',
  },
  returned: {
    label: 'Đã hoàn trả',
    color: COLORS.warning,
    icon: '↩️',
    title: 'Đơn hàng đã được hoàn trả',
    message: 'Yêu cầu hoàn trả đơn hàng của bạn đã được xử lý.',
  },
}

export function orderStatusTemplate(data: OrderStatusData): EmailTemplate {
  const {
    orderId,
    recipientName,
    status,
    trackingNumber,
    trackingUrl,
    carrier,
    estimatedDelivery,
    cancelReason,
    refundAmount,
  } = data

  const orderCode = orderId.slice(0, 8).toUpperCase()
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.confirmed

  // Build tracking info section
  let trackingSection = ''
  if (status === 'shipping' && (trackingNumber || trackingUrl)) {
    trackingSection = `
      <div style="background: ${COLORS.backgroundAlt}; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 15px 0; font-weight: 600; color: ${COLORS.textPrimary}; font-size: 14px;">
          📍 Thông tin vận chuyển
        </p>
        ${carrier ? `
          <p style="margin: 0 0 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">
            <strong>Đơn vị vận chuyển:</strong> ${carrier}
          </p>
        ` : ''}
        ${trackingNumber ? `
          <p style="margin: 0 0 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">
            <strong>Mã vận đơn:</strong> <span style="color: ${COLORS.primary}; font-weight: 600;">${trackingNumber}</span>
          </p>
        ` : ''}
        ${estimatedDelivery ? `
          <p style="margin: 0 0 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">
            <strong>Dự kiến giao:</strong> <span style="color: ${COLORS.success};">${estimatedDelivery}</span>
          </p>
        ` : ''}
        ${trackingUrl ? `
          <div style="margin-top: 15px;">
            <a href="${trackingUrl}" target="_blank" style="display: inline-block; padding: 10px 20px; background: ${COLORS.info}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
              🔍 Theo dõi vận chuyển
            </a>
          </div>
        ` : ''}
      </div>
    `
  }

  // Build cancellation info section
  let cancellationSection = ''
  if (status === 'cancelled') {
    cancellationSection = `
      ${cancelReason ? generateAlert(`Lý do hủy: ${cancelReason}`, 'info') : ''}
      ${refundAmount ? `
        <div style="background: ${COLORS.backgroundAlt}; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px;">
            Số tiền hoàn trả:
          </p>
          <p style="margin: 0; font-size: 24px; font-weight: bold; color: ${COLORS.success};">
            ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refundAmount)}
          </p>
          <p style="margin: 10px 0 0 0; color: ${COLORS.textSecondary}; font-size: 12px;">
            Tiền sẽ được hoàn về tài khoản của bạn trong 3-5 ngày làm việc.
          </p>
        </div>
      ` : ''}
    `
  }

  // Build delivered section with review CTA
  let deliveredSection = ''
  if (status === 'delivered') {
    deliveredSection = `
      <div style="background: linear-gradient(135deg, ${COLORS.primary}15, ${COLORS.success}15); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <p style="margin: 0 0 15px 0; color: ${COLORS.textPrimary}; font-size: 15px;">
          Bạn có hài lòng với đơn hàng không? Hãy để lại đánh giá để giúp chúng tôi phục vụ tốt hơn!
        </p>
        <a href="${COMPANY.website}/profile" target="_blank" style="display: inline-block; padding: 12px 24px; background: ${COLORS.primary}; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">
          ⭐ Đánh giá món
        </a>
      </div>
    `
  }

  const content = `
    <p style="font-size: 16px; color: ${COLORS.textPrimary}; margin: 0 0 20px 0;">
      Xin chào <strong>${recipientName}</strong>,
    </p>
    
    <p style="font-size: 15px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 0 0 20px 0;">
      ${config.message}
    </p>

    ${generateInfoBox(`
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <p style="margin: 0 0 5px 0; color: ${COLORS.textSecondary}; font-size: 12px;">Mã đơn hàng</p>
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: ${COLORS.textPrimary};">#${orderCode}</p>
          </td>
          <td style="text-align: right;">
            <span style="background: ${config.color}; color: #ffffff; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 600;">
              ${config.icon} ${config.label}
            </span>
          </td>
        </tr>
      </table>
    `, config.color)}

    ${trackingSection}
    ${cancellationSection}
    ${deliveredSection}

    ${generateButton('Xem chi tiết đơn hàng', `${COMPANY.website}/checkout/success/${orderId}`)}

    <p style="font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
      Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ hotline <strong style="color: ${COLORS.primary};">${COMPANY.hotline}</strong>
    </p>
  `

  const html = wrapInBaseTemplate(content, {
    title: config.title,
    preheader: `Đơn hàng #${orderCode}: ${config.label}`,
    headerColor: config.color,
  })

  // Plain text version
  const text = `
${config.title.toUpperCase()}

Xin chào ${recipientName},

${config.message}

Mã đơn hàng: #${orderCode}
Trạng thái: ${config.label}

${status === 'shipping' && trackingNumber ? `
THÔNG TIN VẬN CHUYỂN
--------------------
${carrier ? `Đơn vị vận chuyển: ${carrier}` : ''}
Mã vận đơn: ${trackingNumber}
${estimatedDelivery ? `Dự kiến giao: ${estimatedDelivery}` : ''}
${trackingUrl ? `Theo dõi vận chuyển: ${trackingUrl}` : ''}
` : ''}

${status === 'cancelled' ? `
${cancelReason ? `Lý do hủy: ${cancelReason}` : ''}
${refundAmount ? `Số tiền hoàn trả: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(refundAmount)}` : ''}
` : ''}

Xem chi tiết đơn hàng: ${COMPANY.website}/checkout/success/${orderId}

---
${COMPANY.name} - ${COMPANY.tagline}
Hotline: ${COMPANY.hotline}
Email: ${COMPANY.email}
  `.trim()

  return {
    subject: `${config.icon} Đơn hàng #${orderCode}: ${config.label} - ${COMPANY.name}`,
    html,
    text,
  }
}
