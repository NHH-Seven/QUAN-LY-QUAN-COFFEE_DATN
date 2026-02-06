import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { CartContent } from "@/components/cart/cart-content"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Giỏ hàng - NHH-Coffee",
  description: "Giỏ hàng của bạn tại NHH-Coffee",
}

export default function CartPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold">Giỏ hàng</h1>
          <CartContent />
        </div>
      </main>
      <Footer />
    </div>
  )
}
