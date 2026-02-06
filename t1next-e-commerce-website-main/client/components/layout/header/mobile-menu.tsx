/**
 * MobileMenu Component
 * Menu dạng sheet cho mobile devices
 */

import Link from "next/link"
import { Search, Menu, Sun, Moon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { categories } from "@/lib/mock-data"
import { categoryIcons } from "./category-icons"
import type { MobileMenuProps } from "./types"

export function MobileMenu({
  open,
  setOpen,
  isAuthenticated,
  theme,
  setTheme,
  searchQuery,
  setSearchQuery,
  handleSearch,
}: MobileMenuProps) {
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {/* Trigger button - chỉ hiện trên mobile */}
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-white/10">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      {/* Sheet content */}
      <SheetContent side="right" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 flex flex-col gap-4">
          {/* Search */}
          <MobileSearch
            query={searchQuery}
            setQuery={setSearchQuery}
            onSubmit={handleSearch}
          />

          {/* Categories */}
          <MobileCategories onClose={() => setOpen(false)} />

          {/* Auth buttons */}
          {!isAuthenticated && (
            <MobileAuthButtons onClose={() => setOpen(false)} />
          )}

          {/* Theme toggle */}
          <MobileThemeToggle theme={theme} setTheme={setTheme} />
        </div>
      </SheetContent>
    </Sheet>
  )
}

/** Mobile search form */
function MobileSearch({
  query,
  setQuery,
  onSubmit,
}: {
  query: string
  setQuery: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Tìm kiếm..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </form>
  )
}

/** Mobile categories list */
function MobileCategories({ onClose }: { onClose: () => void }) {
  return (
    <div className="space-y-1">
      <h3 className="font-semibold mb-2">Danh mục</h3>
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
          onClick={onClose}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {categoryIcons[cat.icon || ""]}
          </div>
          {cat.name}
        </Link>
      ))}
    </div>
  )
}

/** Mobile auth buttons */
function MobileAuthButtons({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <Button asChild>
        <Link href="/login" onClick={onClose}>
          Đăng nhập
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/register" onClick={onClose}>
          Đăng ký
        </Link>
      </Button>
    </div>
  )
}

/** Mobile theme toggle */
function MobileThemeToggle({
  theme,
  setTheme,
}: {
  theme: string | undefined
  setTheme: (theme: string) => void
}) {
  return (
    <div className="flex items-center justify-between border-t pt-4">
      <span className="text-sm">Giao diện</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? (
          <>
            <Sun className="mr-2 h-4 w-4" />
            Sáng
          </>
        ) : (
          <>
            <Moon className="mr-2 h-4 w-4" />
            Tối
          </>
        )}
      </Button>
    </div>
  )
}
