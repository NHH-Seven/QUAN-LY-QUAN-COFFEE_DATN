/**
 * Welcome Email Template
 * Sent to new users after registration
 */

import {
  EmailTemplate,
  wrapInBaseTemplate,
  generateButton,
  generateInfoBox,
  htmlToPlainText,
  COLORS,
  COMPANY,
} from './base'

export interface WelcomeEmailData {
  name: string
  email: string
  verifyUrl?: string
  verifyOtp?: string
}

export function welcomeTemplate(data: WelcomeEmailData): EmailTemplate {
  const { name, email, verifyUrl, verifyOtp } = data

  const content = `
    <p style="font-size: 16px; color: ${COLORS.textPrimary}; margin: 0 0 20px 0;">
      Xin chào <strong>${name}</strong>,
    </p>
    
    <p style="font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; margin: 0 0 20px 0;">
      Chào mừng bạn đến với <strong>${COMPANY.name}</strong>! 🎉
    </p>
    
    <p style="font-size: 15px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 0 0 20px 0;">
      Tài khoản của bạn đã được tạo thành công với email: <strong>${email}</strong>
    </p>

    ${verifyOtp ? `
      ${generateInfoBox(`
        <p style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px;">Mã xác thực của bạn:</p>
        <p style="margin: 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: ${COLORS.primary}; text-align: center;">
          ${verifyOtp}
        </p>
        <p style="margin: 10px 0 0 0; color: ${COLORS.textSecondary}; font-size: 12px; text-align: center;">
          Mã này sẽ hết hạn sau 10 phút
        </p>
      `)}
    ` : ''}

    ${verifyUrl ? `
      <p style="font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; margin: 20px 0;">
        Vui lòng xác thực email của bạn để kích hoạt tài khoản:
      </p>
      ${generateButton('Xác thực tài khoản', verifyUrl)}
    ` : ''}

    <p style="font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; margin: 20px 0 10px 0;">
      Với tài khoản ${COMPANY.name}, bạn có thể:
    </p>
    
    <ul style="color: ${COLORS.textSecondary}; font-size: 14px; line-height: 1.8; padding-left: 20px; margin: 0 0 20px 0;">
      <li>☕ Đặt hàng và theo dõi đơn hàng dễ dàng</li>
      <li>💰 Tích điểm và nhận ưu đãi độc quyền</li>
      <li>❤️ Lưu món yêu thích vào danh sách</li>
      <li>🔔 Nhận thông báo về khuyến mãi và ưu đãi</li>
      <li>⭐ Đánh giá món và chia sẻ trải nghiệm</li>
    </ul>

    ${generateButton('Khám phá menu', COMPANY.website)}

    <p style="font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 25px 0 0 0;">
      Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi.
    </p>
  `

  const html = wrapInBaseTemplate(content, {
    title: 'Chào mừng đến với NHH-Coffee!',
    preheader: `Xin chào ${name}, tài khoản của bạn đã được tạo thành công.`,
  })

  const text = `
Chào mừng đến với ${COMPANY.name}!

Xin chào ${name},

Tài khoản của bạn đã được tạo thành công với email: ${email}

${verifyOtp ? `Mã xác thực của bạn: ${verifyOtp} (hết hạn sau 10 phút)` : ''}
${verifyUrl ? `Xác thực tài khoản: ${verifyUrl}` : ''}

Với tài khoản ${COMPANY.name}, bạn có thể:
- Đặt hàng và theo dõi đơn hàng dễ dàng
- Tích điểm và nhận ưu đãi độc quyền
- Lưu món yêu thích vào danh sách
- Nhận thông báo về khuyến mãi và ưu đãi
- Đánh giá món và chia sẻ trải nghiệm

Khám phá menu: ${COMPANY.website}

---
${COMPANY.name} - ${COMPANY.tagline}
Hotline: ${COMPANY.hotline}
Email: ${COMPANY.email}
  `.trim()

  return {
    subject: `Chào mừng đến với ${COMPANY.name}! 🎉`,
    html,
    text,
  }
}
