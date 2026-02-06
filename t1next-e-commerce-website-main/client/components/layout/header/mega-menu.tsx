/**
 * MegaMenuDropdown Component
 * Dropdown menu hiển thị danh mục và subcategories
 */

import Link from "next/link"
import { ChevronDown } from "lucide-react"
import { categories } from "@/lib/mock-data"
import { SUBCATEGORIES, FEATURED_BRANDS } from "@/lib/constants/navigation"
import { categoryIcons } from "./category-icons"
import type { MegaMenuDropdownProps } from "./types"

export function MegaMenuDropdown({
  activeCategory,
  setActiveCategory,
  onClose,
}: MegaMenuDropdownProps) {
  return (
    <>
      {/* Dark overlay - click để đóng menu */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Menu content */}
      <div
        className="absolute left-0 right-0 top-full mt-1 bg-background border rounded-lg shadow-xl z-50 flex max-h-[500px]"
        onMouseLeave={onClose}
      >
        {/* Left column: Categories list */}
        <CategoriesList
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          onClose={onClose}
        />

        {/* Right column: Subcategories hoặc Featured Brands */}
        <SubcategoriesPanel
          activeCategory={activeCategory}
          onClose={onClose}
        />
      </div>
    </>
  )
}

/** Danh sách categories bên trái */
function CategoriesList({
  activeCategory,
  setActiveCategory,
  onClose,
}: {
  activeCategory: string | null
  setActiveCategory: (slug: string | null) => void
  onClose: () => void
}) {
  return (
    <div className="min-w-[220px] border-r py-2 overflow-y-auto">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className={`flex items-center gap-2 px-3 py-2 hover:bg-muted transition-colors text-foreground ${
            activeCategory === cat.slug ? "bg-muted" : ""
          }`}
          onMouseEnter={() => setActiveCategory(cat.slug)}
          onClick={onClose}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary flex-shrink-0">
            {categoryIcons[cat.icon || ""]}
          </div>
          <span className="text-sm text-foreground">{cat.name}</span>
          <ChevronDown className="h-3 w-3 -rotate-90 text-muted-foreground ml-auto flex-shrink-0" />
        </Link>
      ))}
    </div>
  )
}

/** Panel subcategories hoặc featured brands bên phải */
function SubcategoriesPanel({
  activeCategory,
  onClose,
}: {
  activeCategory: string | null
  onClose: () => void
}) {
  // Nếu có category được hover và có subcategories
  if (activeCategory && SUBCATEGORIES[activeCategory]) {
    const categoryName = categories.find((c) => c.slug === activeCategory)?.name
    
    return (
      <div className="min-w-[250px] p-4">
        <h4 className="font-semibold mb-3 text-primary">{categoryName}</h4>
        <ul className="space-y-1">
          {SUBCATEGORIES[activeCategory].map((sub) => (
            <li key={sub.slug}>
              <Link
                href={`/category/${activeCategory}/${sub.slug}`}
                className="block text-sm py-1.5 px-2 rounded hover:bg-muted transition-colors text-foreground"
                onClick={onClose}
              >
                {sub.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // Default: Hiển thị featured brands
  return (
    <div className="min-w-[250px] p-4">
      <h4 className="font-semibold mb-3 text-primary">Thương hiệu nổi bật</h4>
      <ul className="grid grid-cols-2 gap-1">
        {FEATURED_BRANDS.map((brand) => (
          <li key={brand.slug}>
            <Link
              href={`/brand/${brand.slug}`}
              className="block text-sm py-1.5 px-2 rounded hover:bg-muted transition-colors text-foreground"
              onClick={onClose}
            >
              {brand.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
