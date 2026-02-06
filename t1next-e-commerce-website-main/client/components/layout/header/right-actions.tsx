/**
 * RightActions Component
 * Các action buttons bên phải header: hotline, store, theme, wishlist, cart, user
 */

import Link from "next/link"
import { ShoppingCart, User, Sun, Moon, MapPin, Phone, Heart, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HOTLINE } from "@/lib/constants/navigation"
import { UserDropdown } from "./user-dropdown"
import { MobileMenu } from "./mobile-menu"
import { useWishlist } from "@/contexts/wishlist-context"
import { UserNotificationBell } from "@/components/notifications/user-notification-bell"
import type { RightActionsProps } from "./types"

export function RightActions({
  theme,
  setTheme,
  totalItems,
  user,
  isAuthenticated,
  logout,
  mobileMenuOpen,
  setMobileMenuOpen,
  searchQuery,
  setSearchQuery,
  handleSearch,
}: RightActionsProps) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {/* Hotline - chỉ hiện trên xl screens */}
      <HotlineLink />

      {/* Store locator - chỉ hiện trên xl screens */}
      <StoreLink />

      {/* Theme toggle */}
      <ThemeToggle theme={theme} setTheme={setTheme} />

      {/* Wishlist */}
      {isAuthenticated && <WishlistButton />}

      {/* Notifications */}
      {isAuthenticated && <UserNotificationBell />}

      {/* Cart */}
      <CartButton totalItems={totalItems} />

      {/* User menu hoặc Login button */}
      {isAuthenticated ? (
        <UserDropdown user={user} logout={logout} />
      ) : (
        <LoginButton />
      )}

      {/* Mobile menu */}
      <MobileMenu
        open={mobileMenuOpen}
        setOpen={setMobileMenuOpen}
        isAuthenticated={isAuthenticated}
        theme={theme}
        setTheme={setTheme}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
      />
    </div>
  )
}

/** Hotline link */
function HotlineLink() {
  return (
    <Link
      href={`tel:${HOTLINE.replace(/\s/g, "")}`}
      className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
    >
      <Phone className="h-4 w-4" />
      <span className="text-sm font-medium">{HOTLINE}</span>
    </Link>
  )
}

/** Store locator link */
function StoreLink() {
  return (
    <Link
      href="/stores"
      className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors whitespace-nowrap"
    >
      <MapPin className="h-4 w-4" />
      <span className="text-sm font-medium">Cửa hàng</span>
    </Link>
  )
}

/** Theme toggle button */
function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: string | undefined
  setTheme: (theme: string) => void
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="text-white hover:bg-white/10"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

/** Cart button với badge số lượng */
function CartButton({ totalItems }: { totalItems: number }) {
  return (
    <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10" asChild>
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        {totalItems > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-yellow-400 text-yellow-900">
            {totalItems}
          </Badge>
        )}
      </Link>
    </Button>
  )
}

/** Wishlist button với badge số lượng */
function WishlistButton() {
  const { items } = useWishlist()
  return (
    <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10 hidden sm:flex" asChild>
      <Link href="/wishlist">
        <Heart className="h-5 w-5" />
        {items.length > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-red-500 text-white">
            {items.length}
          </Badge>
        )}
      </Link>
    </Button>
  )
}

/** Login button cho user chưa đăng nhập */
function LoginButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="hidden sm:flex text-white hover:bg-white/10 gap-2"
    >
      <Link href="/login">
        <User className="h-4 w-4" />
        Đăng nhập
      </Link>
    </Button>
  )
}
