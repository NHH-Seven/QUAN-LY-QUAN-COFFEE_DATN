/**
 * Order Confirmation Email Template
 * Sent when a customer places an order
 */

import {
  EmailTemplate,
  wrapInBaseTemplate,
  generateButton,
  generateInfoBox,
  generateSectionTitle,
  formatPrice,
  COLORS,
  COMPANY,
} from './base'

export interface OrderConfirmationData {
  orderId: string
  recipientName: string
  email: string
  phone: string
  shippingAddress: string
  paymentMethod: 'cod' | 'bank_transfer' | 'credit_card' | 'momo' | 'vnpay'
  items: Array<{
    name: string
    image?: string
    quantity: number
    price: number
    variant?: string
  }>
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  note?: string
  estimatedDelivery?: string
}

const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Thanh toán khi nhận hàng (COD)',
  bank_transfer: 'Chuyển khoản ngân hàng',
  credit_card: 'Thẻ tín dụng/ghi nợ',
  momo: 'Ví MoMo',
  vnpay: 'VNPay',
}

export function orderConfirmationTemplate(data: OrderConfirmationData): EmailTemplate {
  const {
    orderId,
    recipientName,
    phone,
    shippingAddress,
    paymentMethod,
    items,
    subtotal,
    shippingFee,
    discount,
    total,
    note,
    estimatedDelivery,
  } = data

  const orderCode = orderId.slice(0, 8).toUpperCase()
  const paymentLabel = PAYMENT_LABELS[paymentMethod] || paymentMethod

  // Generate items table with images
  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 15px 10px; border-bottom: 1px solid ${COLORS.border}; vertical-align: top;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${item.image ? `
              <td style="width: 60px; vertical-align: top;">
                <img src="${item.image}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid ${COLORS.border};">
              </td>
            ` : ''}
            <td style="vertical-align: top; padding-left: ${item.image ? '10px' : '0'};">
              <p style="margin: 0 0 5px 0; font-weight: 500; color: ${COLORS.textPrimary}; font-size: 14px;">
                ${item.name}
              </p>
              ${item.variant ? `<p style="margin: 0; color: ${COLORS.textSecondary}; font-size: 12px;">${item.variant}</p>` : ''}
            </td>
          </tr>
        </table>
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid ${COLORS.border}; text-align: center; vertical-align: middle; color: ${COLORS.textSecondary}; font-size: 14px;">
        x${item.quantity}
      </td>
      <td style="padding: 15px 10px; border-bottom: 1px solid ${COLORS.border}; text-align: right; vertical-align: middle; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 500;">
        ${formatPrice(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  const content = `
    <p style="font-size: 16px; color: ${COLORS.textPrimary}; margin: 0 0 20px 0;">
      Xin chào <strong>${recipientName}</strong>,
    </p>
    
    <p style="font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; margin: 0 0 20px 0;">
      Cảm ơn bạn đã đặt hàng tại <strong>${COMPANY.name}</strong>! 🎉
    </p>
    
    <p style="font-size: 15px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 0 0 20px 0;">
      Đơn hàng của bạn đã được tiếp nhận và đang chờ xử lý.
    </p>

    ${generateInfoBox(`
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td>
            <p style="margin: 0 0 5px 0; color: ${COLORS.textSecondary}; font-size: 12px;">Mã đơn hàng</p>
            <p style="margin: 0; font-size: 20px; font-weight: bold; color: ${COLORS.primary};">#${orderCode}</p>
          </td>
          <td style="text-align: right;">
            <span style="background: ${COLORS.warning}; color: #ffffff; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">
              Chờ xác nhận
            </span>
          </td>
        </tr>
      </table>
    `)}

    ${generateSectionTitle('Thông tin giao hàng', '📦')}
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
      <tr>
        <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px; width: 120px;">Người nhận:</td>
        <td style="padding: 8px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-weight: 500;">${recipientName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">Điện thoại:</td>
        <td style="padding: 8px 0; color: ${COLORS.textPrimary}; font-size: 14px;">${phone}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px; vertical-align: top;">Địa chỉ:</td>
        <td style="padding: 8px 0; color: ${COLORS.textPrimary}; font-size: 14px;">${shippingAddress}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">Thanh toán:</td>
        <td style="padding: 8px 0; color: ${COLORS.textPrimary}; font-size: 14px;">${paymentLabel}</td>
      </tr>
      ${estimatedDelivery ? `
        <tr>
          <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">Dự kiến giao:</td>
          <td style="padding: 8px 0; color: ${COLORS.success}; font-size: 14px; font-weight: 500;">${estimatedDelivery}</td>
        </tr>
      ` : ''}
      ${note ? `
        <tr>
          <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px; vertical-align: top;">Ghi chú:</td>
          <td style="padding: 8px 0; color: ${COLORS.textPrimary}; font-size: 14px; font-style: italic;">${note}</td>
        </tr>
      ` : ''}
    </table>

    ${generateSectionTitle('Chi tiết đơn hàng', '🛒')}
    
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 20px;">
      <thead>
        <tr style="background: ${COLORS.backgroundAlt};">
          <th style="padding: 12px 10px; text-align: left; font-size: 13px; color: ${COLORS.textSecondary}; font-weight: 600;">Sản phẩm</th>
          <th style="padding: 12px 10px; text-align: center; font-size: 13px; color: ${COLORS.textSecondary}; font-weight: 600;">SL</th>
          <th style="padding: 12px 10px; text-align: right; font-size: 13px; color: ${COLORS.textSecondary}; font-weight: 600;">Thành tiền</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 25px;">
      <tr>
        <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">Tạm tính:</td>
        <td style="padding: 8px 0; color: ${COLORS.textPrimary}; font-size: 14px; text-align: right;">${formatPrice(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: ${COLORS.textSecondary}; font-size: 14px;">Phí vận chuyển:</td>
        <td style="padding: 8px 0; color: ${COLORS.textPrimary}; font-size: 14px; text-align: right;">${shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}</td>
      </tr>
      ${discount > 0 ? `
        <tr>
          <td style="padding: 8px 0; color: ${COLORS.success}; font-size: 14px;">Giảm giá:</td>
          <td style="padding: 8px 0; color: ${COLORS.success}; font-size: 14px; text-align: right;">-${formatPrice(discount)}</td>
        </tr>
      ` : ''}
      <tr>
        <td style="padding: 12px 0; border-top: 2px solid ${COLORS.border}; color: ${COLORS.textPrimary}; font-size: 16px; font-weight: bold;">Tổng cộng:</td>
        <td style="padding: 12px 0; border-top: 2px solid ${COLORS.border}; color: ${COLORS.primary}; font-size: 18px; font-weight: bold; text-align: right;">${formatPrice(total)}</td>
      </tr>
    </table>

    ${generateButton('Theo dõi đơn hàng', `${COMPANY.website}/profile`)}

    <p style="font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 20px 0 0 0; text-align: center;">
      Chúng tôi sẽ thông báo cho bạn khi đơn hàng được xác nhận và giao đi.
    </p>
  `

  const html = wrapInBaseTemplate(content, {
    title: '🎉 Đặt hàng thành công!',
    preheader: `Đơn hàng #${orderCode} đã được tiếp nhận. Cảm ơn bạn đã mua sắm tại ${COMPANY.name}!`,
  })

  // Plain text version
  const itemsText = items.map(item => 
    `- ${item.name}${item.variant ? ` (${item.variant})` : ''} x${item.quantity}: ${formatPrice(item.price * item.quantity)}`
  ).join('\n')

  const text = `
ĐẶT HÀNG THÀNH CÔNG!

Xin chào ${recipientName},

Cảm ơn bạn đã đặt hàng tại ${COMPANY.name}!
Đơn hàng của bạn đã được tiếp nhận và đang chờ xử lý.

Mã đơn hàng: #${orderCode}

THÔNG TIN GIAO HÀNG
-------------------
Người nhận: ${recipientName}
Điện thoại: ${phone}
Địa chỉ: ${shippingAddress}
Thanh toán: ${paymentLabel}
${estimatedDelivery ? `Dự kiến giao: ${estimatedDelivery}` : ''}
${note ? `Ghi chú: ${note}` : ''}

CHI TIẾT ĐƠN HÀNG
-----------------
${itemsText}

Tạm tính: ${formatPrice(subtotal)}
Phí vận chuyển: ${shippingFee === 0 ? 'Miễn phí' : formatPrice(shippingFee)}
${discount > 0 ? `Giảm giá: -${formatPrice(discount)}` : ''}
Tổng cộng: ${formatPrice(total)}

Theo dõi đơn hàng: ${COMPANY.website}/profile

---
${COMPANY.name} - ${COMPANY.tagline}
Hotline: ${COMPANY.hotline}
Email: ${COMPANY.email}
  `.trim()

  return {
    subject: `Xác nhận đơn hàng #${orderCode} - ${COMPANY.name}`,
    html,
    text,
  }
}
