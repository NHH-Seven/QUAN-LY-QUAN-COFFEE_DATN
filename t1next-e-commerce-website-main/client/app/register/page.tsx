import { RegisterForm } from "@/components/auth/register-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Đăng ký - NHH-Coffee",
  description: "Tạo tài khoản NHH-Coffee mới",
}

export default function RegisterPage() {
  return <RegisterForm />
}
