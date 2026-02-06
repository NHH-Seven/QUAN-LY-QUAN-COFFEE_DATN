import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { ProfileContent } from "@/components/profile/profile-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tài khoản - NHH-Coffee",
  description: "Quản lý tài khoản NHH-Coffee của bạn",
}

export default function ProfilePage() {
  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <ProfileContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
