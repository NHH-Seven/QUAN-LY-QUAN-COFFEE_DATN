import { LoginForm } from "@/components/auth/login-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Đăng nhập - NHH-Coffee",
  description: "Đăng nhập tài khoản NHH-Coffee của bạn",
}

export default function LoginPage() {
  return <LoginForm />
}
