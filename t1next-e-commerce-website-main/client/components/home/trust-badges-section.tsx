import { Truck, Shield, Headphones, RotateCcw, CreditCard, Award } from "lucide-react"

const badges = [
  {
    icon: Truck,
    title: "Giao hàng nhanh",
    description: "Miễn phí ship đơn từ 100K",
  },
  {
    icon: Shield,
    title: "Chất lượng đảm bảo",
    description: "Nguyên liệu tươi ngon",
  },
  {
    icon: RotateCcw,
    title: "Đổi trả dễ dàng",
    description: "Hoàn tiền nếu không hài lòng",
  },
  {
    icon: Headphones,
    title: "Hỗ trợ 24/7",
    description: "Tư vấn nhiệt tình",
  },
  {
    icon: CreditCard,
    title: "Thanh toán an toàn",
    description: "Đa dạng phương thức",
  },
  {
    icon: Award,
    title: "Thương hiệu uy tín",
    description: "Được khách hàng tin yêu",
  },
]

export function TrustBadgesSection() {
  return (
    <section className="py-12 md:py-16 border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          {badges.map((badge) => (
            <div key={badge.title} className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <badge.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mt-3 text-sm font-semibold">{badge.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
