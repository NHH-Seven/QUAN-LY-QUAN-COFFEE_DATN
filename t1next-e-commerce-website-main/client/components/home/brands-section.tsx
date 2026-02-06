import Link from "next/link"
import { Coffee, Leaf, Bean, Award, Star, Heart, Sparkles, Crown } from "lucide-react"

const brands = [
  { name: "Trung Nguyên", slug: "trung-nguyen", icon: Coffee },
  { name: "Highlands", slug: "highlands", icon: Leaf },
  { name: "Phúc Long", slug: "phuc-long", icon: Bean },
  { name: "The Coffee House", slug: "the-coffee-house", icon: Award },
  { name: "Starbucks", slug: "starbucks", icon: Star },
  { name: "Lavazza", slug: "lavazza", icon: Heart },
  { name: "illy", slug: "illy", icon: Sparkles },
  { name: "Nescafé", slug: "nescafe", icon: Crown },
]

export function BrandsSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-bold md:text-3xl">Thương hiệu nổi bật</h2>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Nguyên liệu chất lượng - Hương vị đậm đà
          </p>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-4 md:grid-cols-8">
          {brands.map((brand) => {
            const Icon = brand.icon
            return (
              <Link
                key={brand.slug}
                href={`/search?brand=${brand.slug}`}
                className="group flex flex-col h-20 sm:h-24 items-center justify-center rounded-xl border border-border bg-card p-3 transition-all hover:border-primary hover:shadow-lg hover:shadow-primary/10"
              >
                <Icon className="h-6 w-6 sm:h-8 sm:w-8 text-primary transition-all group-hover:scale-110" />
                <span className="mt-1 text-[10px] sm:text-xs font-medium text-center line-clamp-1">{brand.name}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
