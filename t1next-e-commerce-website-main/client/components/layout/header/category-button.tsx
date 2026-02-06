/**
 * CategoryButton Component
 * Nút mở mega menu danh mục sản phẩm
 */

import { Menu, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { CategoryButtonProps } from "./types"

export function CategoryButton({ onMouseEnter, onClick }: CategoryButtonProps) {
  return (
    <div>
      <Button
        variant="ghost"
        className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white h-10 px-4 rounded-l-lg rounded-r-none border-r border-white/20 shrink-0"
        onMouseEnter={onMouseEnter}
        onClick={onClick}
      >
        <Menu className="h-4 w-4" />
        <span className="font-medium">Danh mục</span>
        <ChevronDown className="h-4 w-4" />
      </Button>
    </div>
  )
}
