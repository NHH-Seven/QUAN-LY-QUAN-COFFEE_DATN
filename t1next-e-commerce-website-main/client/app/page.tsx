import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { HeroSection } from "@/components/home/hero-section"
import { CategoriesSection } from "@/components/home/categories-section"
import { FeaturedProducts } from "@/components/home/featured-products"
import { PromoBanner } from "@/components/home/promo-banner"
import { NewProducts } from "@/components/home/new-products"
import { BestsellerSection } from "@/components/home/bestseller-section"
import { TrustBadgesSection } from "@/components/home/trust-badges-section"
import { BrandsSection } from "@/components/home/brands-section"
import { RecentlyViewedSection } from "@/components/home/recently-viewed-section"
import { FlashSaleSection } from "@/components/home/flash-sale-section"
import { JsonLd } from "@/components/seo"
import { generateOrganizationJsonLd, generateWebSiteJsonLd } from "@/lib/seo"

export default function HomePage() {
  // Generate JSON-LD structured data for home page
  const organizationJsonLd = generateOrganizationJsonLd()
  const webSiteJsonLd = generateWebSiteJsonLd()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* JSON-LD Structured Data */}
      <JsonLd data={[organizationJsonLd, webSiteJsonLd]} />
      
      <Header />
      <main className="flex-1 overflow-y-auto">
        <HeroSection />
        <TrustBadgesSection />
        <FlashSaleSection />
        <CategoriesSection />
        <FeaturedProducts />
        <PromoBanner />
        <NewProducts />
        <BestsellerSection />
        <RecentlyViewedSection />
        <BrandsSection />
        <Footer />
      </main>
    </div>
  )
}
