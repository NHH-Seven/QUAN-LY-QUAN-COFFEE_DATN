/**
 * Custom hook để quản lý state của mega menu
 * Tách logic ra khỏi Header component
 */

import { useState, useCallback } from "react"

interface UseMegaMenuReturn {
  /** Menu đang mở hay không */
  isOpen: boolean
  /** Category đang được hover */
  activeCategory: string | null
  /** Mở menu */
  open: () => void
  /** Đóng menu */
  close: () => void
  /** Toggle menu */
  toggle: () => void
  /** Set category đang active */
  setActiveCategory: (slug: string | null) => void
  /** Đóng menu và reset active category */
  closeAndReset: () => void
}

export function useMegaMenu(): UseMegaMenuReturn {
  const [isOpen, setIsOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  const closeAndReset = useCallback(() => {
    setIsOpen(false)
    setActiveCategory(null)
  }, [])

  return {
    isOpen,
    activeCategory,
    open,
    close,
    toggle,
    setActiveCategory,
    closeAndReset,
  }
}
