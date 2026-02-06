"use client"

/**
 * Header Component
 * Main navigation header với mega menu, search bar, và user actions
 * 
 * Structure:
 * - Logo (trái)
 * - Category Button + Search Bar (giữa)
 * - Right Actions: Hotline, Store, Theme, Cart, User (phải)
 * - Mega Menu Dropdown (khi hover/click Category)
 * - Mobile Menu (cho mobile devices)
 */

import { useState } from "react"
import { useTheme } from "next-themes"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useMegaMenu } from "@/hooks/use-mega-menu"
import { useSearch } from "@/hooks/use-search"

// Sub-components
import { Logo } from "./logo"
import { CategoryButton } from "./category-button"
import { SearchBar } from "./search-bar"
import { MegaMenuDropdown } from "./mega-menu"
import { RightActions } from "./right-actions"

export function Header() {
  // Custom hooks for logic separation
  const megaMenu = useMegaMenu()
  const search = useSearch()

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // External hooks
  const { theme, setTheme } = useTheme()
  const { totalItems } = useCart()
  const { user, isAuthenticated, logout } = useAuth()

  return (
    <header className="sticky top-0 z-50 w-full bg-background shadow-sm">
      {/* Main header bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            {/* Logo */}
            <Logo />

            {/* Center: Category + Search (hidden on mobile) */}
            <div className="hidden md:flex items-center justify-center flex-1">
              <div className="relative flex items-center w-full max-w-2xl">
                {/* Category Button */}
                <CategoryButton
                  onMouseEnter={megaMenu.open}
                  onClick={megaMenu.toggle}
                />

                {/* Search Bar */}
                <SearchBar
                  query={search.query}
                  setQuery={search.setQuery}
                  onSubmit={search.handleSearch}
                />

                {/* Mega Menu Dropdown */}
                {megaMenu.isOpen && (
                  <MegaMenuDropdown
                    activeCategory={megaMenu.activeCategory}
                    setActiveCategory={megaMenu.setActiveCategory}
                    onClose={megaMenu.closeAndReset}
                  />
                )}
              </div>
            </div>

            {/* Right Actions */}
            <RightActions
              theme={theme}
              setTheme={setTheme}
              totalItems={totalItems}
              user={user}
              isAuthenticated={isAuthenticated}
              logout={logout}
              mobileMenuOpen={mobileMenuOpen}
              setMobileMenuOpen={setMobileMenuOpen}
              searchQuery={search.query}
              setSearchQuery={search.setQuery}
              handleSearch={search.handleSearch}
            />
          </div>
        </div>
      </div>
    </header>
  )
}

// Re-export sub-components for external use if needed
export { Logo } from "./logo"
export { SearchBar } from "./search-bar"
export { MegaMenuDropdown } from "./mega-menu"
export { UserDropdown } from "./user-dropdown"
export { MobileMenu } from "./mobile-menu"
