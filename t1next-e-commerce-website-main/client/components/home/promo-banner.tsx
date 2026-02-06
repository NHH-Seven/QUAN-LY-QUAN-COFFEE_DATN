import Link from "next/link"
import { Zap, Gift, Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PromoBanner() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Flash Sale */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-amber-700 p-6 text-white md:col-span-2 lg:col-span-1">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6" />
                <span className="font-semibold uppercase tracking-wider">Flash Sale</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold">Giảm đến 30%</h3>
              <p className="mt-2 text-white/80">Tất cả đồ uống</p>
              <Button variant="secondary" className="mt-6" asChild>
                <Link href="/flash-sale">Đặt ngay</Link>
              </Button>
            </div>
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
            <div className="absolute -top-10 -right-20 h-60 w-60 rounded-full bg-white/5" />
          </div>

          {/* Member Exclusive */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-800 to-amber-950 p-6 text-white">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Gift className="h-6 w-6" />
                <span className="font-semibold uppercase tracking-wider">Ưu đãi thành viên</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold">Giảm thêm 10%</h3>
              <p className="mt-2 opacity-80">Cho đơn hàng đầu tiên</p>
              <Button variant="secondary" className="mt-6" asChild>
                <Link href="/register">Đăng ký ngay</Link>
              </Button>
            </div>
            <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10" />
          </div>

          {/* Combo */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 dark:from-stone-800 dark:to-stone-900 p-6">
            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Combo tiết kiệm</span>
              </div>
              <h3 className="mt-4 text-2xl font-bold">Combo sáng</h3>
              <p className="mt-2 text-muted-foreground">Tiết kiệm đến 23% khi mua combo</p>
              <Button className="mt-6" asChild>
                <Link href="/category/combo">Xem combo</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
