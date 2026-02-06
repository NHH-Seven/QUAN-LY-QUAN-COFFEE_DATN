/**
 * Email Verification Template
 */

import { getBaseTemplate } from './base.js'

export function getVerificationEmail(name: string, otp: string): string {
  const content = `
    <h2 style="color: #f97316; margin-bottom: 20px;">Xác thực tài khoản</h2>
    
    <p>Xin chào <strong>${name}</strong>,</p>
    
    <p>Cảm ơn bạn đã đăng ký tài khoản tại <strong>NHH Coffee</strong>!</p>
    
    <p>Để hoàn tất đăng ký, vui lòng nhập mã OTP sau:</p>
    
    <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
      <div style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 8px;">
        ${otp}
      </div>
      <p style="margin-top: 10px; color: #6b7280; font-size: 14px;">
        Mã có hiệu lực trong 10 phút
      </p>
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">
      <strong>Lưu ý:</strong> Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.
    </p>
    
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <p style="color: #6b7280; font-size: 14px; margin: 0;">
        Trân trọng,<br>
        <strong>Đội ngũ NHH Coffee</strong>
      </p>
    </div>
  `

  return getBaseTemplate(content, 'Xác thực tài khoản')
}
