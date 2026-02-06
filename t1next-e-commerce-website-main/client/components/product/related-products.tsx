import { ProductCard } from "@/components/product/product-card"
import type { Product } from "@/lib/types"

interface RelatedProductsProps {
  products: Product[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold">Sản phẩm liên quan</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
