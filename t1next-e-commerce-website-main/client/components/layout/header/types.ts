/**
 * Header Types
 * Định nghĩa tất cả types cho Header components
 */

import type React from "react"

/** Props cho SearchBar component */
export interface SearchBarProps {
  query: string
  setQuery: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
}

/** Props cho CategoryButton component */
export interface CategoryButtonProps {
  onMouseEnter: () => void
  onClick: () => void
}

/** Props cho MegaMenuDropdown component */
export interface MegaMenuDropdownProps {
  activeCategory: string | null
  setActiveCategory: (slug: string | null) => void
  onClose: () => void
}

/** Props cho UserDropdown component */
export interface UserDropdownProps {
  user: { name?: string; email?: string } | null
  logout: () => void
}

/** Props cho MobileMenu component */
export interface MobileMenuProps {
  open: boolean
  setOpen: (open: boolean) => void
  isAuthenticated: boolean
  theme: string | undefined
  setTheme: (theme: string) => void
  searchQuery: string
  setSearchQuery: (value: string) => void
  handleSearch: (e: React.FormEvent) => void
}

/** Props cho RightActions component */
export interface RightActionsProps extends MobileMenuProps {
  totalItems: number
  user: { name?: string; email?: string } | null
  logout: () => void
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void
}
