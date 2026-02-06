/**
 * Password Reset Email Template
 * Sent when a user requests to reset their password
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

export interface PasswordResetData {
  name: string
  email: string
  otp: string
  resetUrl?: string
  expiresIn?: string
  ipAddress?: string
  userAgent?: string
}

export function passwordResetTemplate(data: PasswordResetData): EmailTemplate {
  const {
    name,
    email,
    otp,
    resetUrl,
    expiresIn = '10 phút',
    ipAddress,
    userAgent,
  } = data

  // Security info section
  let securityInfo = ''
  if (ipAddress || userAgent) {
    securityInfo = `
      <div style="background: ${COLORS.backgroundAlt}; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: ${COLORS.textSecondary}; font-size: 12px; text-transform: uppercase;">
          🔒 Thông tin yêu cầu
        </p>
        ${ipAddress ? `
          <p style="margin: 0 0 5px 0; color: ${COLORS.textSecondary}; font-size: 13px;">
            <strong>Địa chỉ IP:</strong> ${ipAddress}
          </p>
        ` : ''}
        ${userAgent ? `
          <p style="margin: 0; color: ${COLORS.textSecondary}; font-size: 13px;">
            <strong>Thiết bị:</strong> ${userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent}
          </p>
        ` : ''}
      </div>
    `
  }

  const content = `
    <p style="font-size: 16px; color: ${COLORS.textPrimary}; margin: 0 0 20px 0;">
      Xin chào <strong>${name}</strong>,
    </p>
    
    <p style="font-size: 15px; color: ${COLORS.textPrimary}; line-height: 1.6; margin: 0 0 20px 0;">
      Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>${email}</strong>.
    </p>

    ${generateInfoBox(`
      <p style="margin: 0 0 10px 0; color: ${COLORS.textSecondary}; font-size: 14px; text-align: center;">
        Mã xác thực của bạn:
      </p>
      <p style="margin: 0; font-size: 36px; font-weight: bold; letter-spacing: 10px; color: ${COLORS.primary}; text-align: center; font-family: 'Courier New', monospace;">
        ${otp}
      </p>
      <p style="margin: 15px 0 0 0; color: ${COLORS.textSecondary}; font-size: 12px; text-align: center;">
        ⏱️ Mã này sẽ hết hạn sau <strong>${expiresIn}</strong>
      </p>
    `)}

    ${resetUrl ? `
      <p style="font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 20px 0; text-align: center;">
        Hoặc nhấn vào nút bên dưới để đặt lại mật khẩu:
      </p>
      ${generateButton('Đặt lại mật khẩu', resetUrl)}
    ` : ''}

    ${generateAlert(
      'Không chia sẻ mã này với bất kỳ ai. Nhân viên NHH-Coffee sẽ không bao giờ yêu cầu mã xác thực của bạn.',
      'warning'
    )}

    ${securityInfo}

    <div style="border-top: 1px solid ${COLORS.border}; padding-top: 20px; margin-top: 25px;">
      <p style="font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 0 0 10px 0;">
        <strong>Bạn không yêu cầu đặt lại mật khẩu?</strong>
      </p>
      <p style="font-size: 14px; color: ${COLORS.textSecondary}; line-height: 1.6; margin: 0;">
        Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.
        Nếu bạn lo ngại về bảo mật tài khoản, hãy liên hệ với chúng tôi ngay.
      </p>
    </div>

    <div style="text-align: center; margin-top: 25px;">
      <a href="${COMPANY.website}/login" style="color: ${COLORS.primary}; text-decoration: none; font-size: 14px;">
        ← Quay lại đăng nhập
      </a>
    </div>
  `

  const html = wrapInBaseTemplate(content, {
    title: '🔐 Đặt lại mật khẩu',
    preheader: `Mã xác thực của bạn: ${otp}. Mã này sẽ hết hạn sau ${expiresIn}.`,
    headerColor: COLORS.warning,
  })

  // Plain text version
  const text = `
ĐẶT LẠI MẬT KHẨU

Xin chào ${name},

Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${email}.

MÃ XÁC THỰC CỦA BẠN: ${otp}

⏱️ Mã này sẽ hết hạn sau ${expiresIn}

${resetUrl ? `Hoặc truy cập link sau để đặt lại mật khẩu: ${resetUrl}` : ''}

⚠️ CẢNH BÁO BẢO MẬT
Không chia sẻ mã này với bất kỳ ai. Nhân viên ${COMPANY.name} sẽ không bao giờ yêu cầu mã xác thực của bạn.

${ipAddress ? `Địa chỉ IP: ${ipAddress}` : ''}
${userAgent ? `Thiết bị: ${userAgent}` : ''}

Bạn không yêu cầu đặt lại mật khẩu?
Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.

---
${COMPANY.name} - ${COMPANY.tagline}
Hotline: ${COMPANY.hotline}
Email: ${COMPANY.email}
  `.trim()

  return {
    subject: `🔐 Mã xác thực đặt lại mật khẩu - ${COMPANY.name}`,
    html,
    text,
  }
}
