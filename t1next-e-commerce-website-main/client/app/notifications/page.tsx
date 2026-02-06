import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { NotificationsContent } from "@/components/notifications/notifications-content"

export const metadata = {
  title: "Thông báo - NHH-Coffee",
  description: "Xem tất cả thông báo của bạn",
}

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      <Header />
      <main className="flex-1 bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <NotificationsContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
