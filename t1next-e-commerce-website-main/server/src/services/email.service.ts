/**
 * Email Service
 * Gửi email thông báo cho user
 * 
 * Cần config SMTP trong .env:
 * SMTP_HOST=smtp.gmail.com
 * SMTP_PORT=587
 * SMTP_USER=your-email@gmail.com
 * SMTP_PASS=your-app-password
 * SMTP_FROM=NHH-Coffee <noreply@nhh-coffee.com>
 */

import nodemailer from 'nodemailer'

const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  if (!transporter) {
    console.log('[Email] SMTP not configured, skipping email:', options.subject)
    return false
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'NHH-Coffee <noreply@nhh-coffee.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
    })
    console.log('[Email] Sent:', options.subject, 'to', options.to)
    return true
  } catch (error) {
    console.error('[Email] Failed to send:', error)
    return false
  }
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}


// Email templates
export function orderConfirmationEmail(order: {
  id: string
  recipientName: string
  total: number
  items: Array<{ name: string; quantity: number; price: number }>
}): string {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('')

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Đặt hàng thành công!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Xin chào <strong>${order.recipientName}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại NHH-Coffee. Đơn hàng của bạn đã được tiếp nhận.</p>
        
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Mã đơn hàng:</strong> #${order.id.slice(0, 8).toUpperCase()}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; text-align: center;">SL</th>
              <th style="padding: 10px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 10px; text-align: right;"><strong>Tổng cộng:</strong></td>
              <td style="padding: 10px; text-align: right; color: #14b8a6;"><strong>${formatPrice(order.total)}</strong></td>
            </tr>
          </tfoot>
        </table>

        <p style="margin-top: 20px;">Chúng tôi sẽ liên hệ với bạn sớm nhất để xác nhận đơn hàng.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile" 
             style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Theo dõi đơn hàng
          </a>
        </div>
      </div>
      <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>NHH-Coffee - Cửa hàng cà phê & trà</p>
      </div>
    </div>
  `
}

export function orderStatusEmail(order: {
  id: string
  recipientName: string
  status: string
}): string {
  const statusMap: Record<string, { label: string; color: string; message: string }> = {
    confirmed: { label: 'Đã xác nhận', color: '#22c55e', message: 'Đơn hàng của bạn đã được xác nhận và đang chuẩn bị.' },
    shipping: { label: 'Đang giao hàng', color: '#3b82f6', message: 'Đơn hàng của bạn đang trên đường giao đến.' },
    delivered: { label: 'Đã giao hàng', color: '#14b8a6', message: 'Đơn hàng đã được giao thành công. Cảm ơn bạn đã đặt hàng!' },
    cancelled: { label: 'Đã hủy', color: '#ef4444', message: 'Đơn hàng của bạn đã bị hủy.' },
  }

  const info = statusMap[order.status] || { label: order.status, color: '#6b7280', message: '' }

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${info.color}; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Cập nhật đơn hàng</h1>
      </div>
      <div style="padding: 20px;">
        <p>Xin chào <strong>${order.recipientName}</strong>,</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0;">Đơn hàng <strong>#${order.id.slice(0, 8).toUpperCase()}</strong></p>
          <span style="background: ${info.color}; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold;">
            ${info.label}
          </span>
        </div>

        <p>${info.message}</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/checkout/success/${order.id}" 
             style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Xem chi tiết đơn hàng
          </a>
        </div>
      </div>
      <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>NHH-Coffee - Cửa hàng cà phê & trà</p>
      </div>
    </div>
  `
}


// Send OTP email for registration or password reset
export async function sendOTPEmail(
  email: string, 
  name: string, 
  otp: string, 
  type: 'register' | 'reset' = 'register'
): Promise<boolean> {
  const isReset = type === 'reset'
  const subject = isReset ? 'Đặt lại mật khẩu - NHH-Coffee' : 'Xác thực tài khoản - NHH-Coffee'
  const title = isReset ? 'Đặt lại mật khẩu' : 'Xác thực tài khoản'
  const message = isReset 
    ? 'Bạn đã yêu cầu đặt lại mật khẩu. Sử dụng mã OTP bên dưới để tiếp tục:'
    : 'Cảm ơn bạn đã đăng ký tài khoản tại NHH-Coffee. Sử dụng mã OTP bên dưới để xác thực:'

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">${title}</h1>
      </div>
      <div style="padding: 20px;">
        <p>Xin chào <strong>${name}</strong>,</p>
        <p>${message}</p>
        
        <div style="background: #f9fafb; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; color: #6b7280;">Mã xác thực của bạn:</p>
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #14b8a6;">
            ${otp}
          </span>
        </div>

        <p style="color: #ef4444; font-size: 14px;">⚠️ Mã này sẽ hết hạn sau 10 phút. Không chia sẻ mã này với bất kỳ ai.</p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          Nếu bạn không yêu cầu ${isReset ? 'đặt lại mật khẩu' : 'đăng ký tài khoản'}, vui lòng bỏ qua email này.
        </p>
      </div>
      <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p>NHH-Coffee - Cửa hàng cà phê & trà</p>
      </div>
    </div>
  `

  return sendEmail({ to: email, subject, html })
}

// Order email data interface
export interface OrderEmailData {
  orderId: string
  recipientName: string
  phone: string
  shippingAddress: string
  paymentMethod: 'cod' | 'bank_transfer'
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  shippingFee: number
  discount: number
  total: number
  note?: string
}

// Send order confirmation email
export async function sendOrderConfirmationEmail(
  email: string,
  data: OrderEmailData
): Promise<boolean> {
  const paymentMethodLabel = data.paymentMethod === 'cod' 
    ? 'Thanh toán khi nhận hàng (COD)' 
    : 'Chuyển khoản ngân hàng'

  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('')

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">🎉 Đặt hàng thành công!</h1>
      </div>
      <div style="padding: 20px;">
        <p>Xin chào <strong>${data.recipientName}</strong>,</p>
        <p>Cảm ơn bạn đã đặt hàng tại NHH-Coffee. Đơn hàng của bạn đã được tiếp nhận và đang chờ xử lý.</p>
        
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #14b8a6;">
          <p style="margin: 0;"><strong>Mã đơn hàng:</strong> #${data.orderId.slice(0, 8).toUpperCase()}</p>
        </div>

        <h3 style="border-bottom: 2px solid #14b8a6; padding-bottom: 8px;">📦 Thông tin giao hàng</h3>
        <p><strong>Người nhận:</strong> ${data.recipientName}</p>
        <p><strong>Điện thoại:</strong> ${data.phone}</p>
        <p><strong>Địa chỉ:</strong> ${data.shippingAddress}</p>
        <p><strong>Thanh toán:</strong> ${paymentMethodLabel}</p>
        ${data.note ? `<p><strong>Ghi chú:</strong> ${data.note}</p>` : ''}

        <h3 style="border-bottom: 2px solid #14b8a6; padding-bottom: 8px; margin-top: 30px;">🛒 Chi tiết đơn hàng</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 10px; text-align: left;">Sản phẩm</th>
              <th style="padding: 10px; text-align: center;">SL</th>
              <th style="padding: 10px; text-align: right;">Đơn giá</th>
              <th style="padding: 10px; text-align: right;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="margin-top: 20px; text-align: right;">
          <p><strong>Tạm tính:</strong> ${formatPrice(data.subtotal)}</p>
          <p><strong>Phí vận chuyển:</strong> ${formatPrice(data.shippingFee)}</p>
          ${data.discount > 0 ? `<p style="color: #22c55e;"><strong>Giảm giá:</strong> -${formatPrice(data.discount)}</p>` : ''}
          <p style="font-size: 18px; color: #14b8a6;"><strong>Tổng cộng:</strong> ${formatPrice(data.total)}</p>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/profile" 
             style="background: #14b8a6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Theo dõi đơn hàng
          </a>
        </div>

        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
          Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ hotline: <strong>0762393111</strong>
        </p>
      </div>
      <div style="background: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
        <p style="margin: 0;">NHH-Coffee - Cửa hàng cà phê & trà</p>
        <p style="margin: 5px 0 0 0;">© 2024 NHH-Coffee. All rights reserved.</p>
      </div>
    </div>
  `

  return sendEmail({
    to: email,
    subject: `Xác nhận đơn hàng #${data.orderId.slice(0, 8).toUpperCase()} - NHH-Coffee`,
    html
  })
}
