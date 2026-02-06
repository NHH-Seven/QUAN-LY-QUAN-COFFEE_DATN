import { Suspense } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SearchResults } from "@/components/search/search-results"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Tìm kiếm - NHH-Coffee",
  description: "Tìm kiếm đồ uống và món ăn tại NHH-Coffee",
}

export default function SearchPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-y-auto h-screen">
      <Header />
      <main className="flex-1 bg-muted/30">
        <Suspense fallback={
          <div className="container mx-auto px-4 py-8 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        }>
          <SearchResults />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
