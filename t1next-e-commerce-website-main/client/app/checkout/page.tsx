import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CheckoutContent } from "@/components/checkout/checkout-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Thanh toán - NHH-Coffee",
  description: "Hoàn tất đơn hàng của bạn tại NHH-Coffee",
}

export default function CheckoutPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold">Thanh toán</h1>
          <CheckoutContent />
        </div>
        <Footer />
      </main>
    </div>
  )
}
