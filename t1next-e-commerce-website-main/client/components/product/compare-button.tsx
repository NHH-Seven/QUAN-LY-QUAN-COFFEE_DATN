"use client"

import { GitCompareArrows, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useCompare, MAX_COMPARE_ITEMS } from "@/contexts/compare-context"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface CompareButtonProps {
  productId: string
  /** Variant style for the button */
  variant?: "icon" | "full" | "outline"
  /** Additional class names */
  className?: string
  /** Size of the button */
  size?: "sm" | "default" | "lg"
}

/**
 * CompareButton component
 * Toggle button to add/remove products from compare list
 * Shows visual feedback for current state
 */
export function CompareButton({ 
  productId, 
  variant = "icon",
  className,
  size = "default"
}: CompareButtonProps) {
  const { addToCompare, removeFromCompare, isInCompare, isMaxReached, compareCount } = useCompare()
  const { toast } = useToast()
  
  const inCompare = isInCompare(productId)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (inCompare) {
      removeFromCompare(productId)
      toast({
        title: "Đã xóa khỏi so sánh",
        description: `Còn ${compareCount - 1} sản phẩm trong danh sách so sánh`,
      })
    } else {
      if (isMaxReached) {
        toast({
          title: "Đã đạt giới hạn",
          description: `Chỉ có thể so sánh tối đa ${MAX_COMPARE_ITEMS} sản phẩm`,
          variant: "destructive",
        })
        return
      }
      
      const added = addToCompare(productId)
      if (added) {
        toast({
          title: "Đã thêm vào so sánh",
          description: `${compareCount + 1}/${MAX_COMPARE_ITEMS} sản phẩm`,
          variant: "success",
        })
      }
    }
  }

  // Icon-only variant (for product cards)
  if (variant === "icon") {
    return (
      <Button
        size="icon"
        variant={inCompare ? "default" : "secondary"}
        className={cn(
          "h-8 w-8 rounded-full shadow-md transition-all",
          inCompare && "bg-blue-500 hover:bg-blue-600",
          className
        )}
        onClick={handleClick}
        title={inCompare ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
      >
        {inCompare ? (
          <Check className="h-4 w-4" />
        ) : (
          <GitCompareArrows className="h-4 w-4" />
        )}
        <span className="sr-only">
          {inCompare ? "Xóa khỏi so sánh" : "Thêm vào so sánh"}
        </span>
      </Button>
    )
  }

  // Outline variant (for product detail page)
  if (variant === "outline") {
    const sizeClasses = {
      sm: "h-8 text-xs",
      default: "h-9 text-sm",
      lg: "h-10 text-sm",
    }

    return (
      <Button
        variant={inCompare ? "default" : "outline"}
        className={cn(
          sizeClasses[size],
          inCompare && "bg-blue-500 hover:bg-blue-600",
          className
        )}
        onClick={handleClick}
      >
        {inCompare ? (
          <>
            <Check className="mr-1.5 h-4 w-4" />
            Đang so sánh
          </>
        ) : (
          <>
            <GitCompareArrows className="mr-1.5 h-4 w-4" />
            So sánh
          </>
        )}
      </Button>
    )
  }

  // Full variant (with text, for larger buttons)
  const sizeClasses = {
    sm: "h-8 text-xs",
    default: "h-9 text-sm",
    lg: "h-10 text-sm",
  }

  return (
    <Button
      variant={inCompare ? "default" : "secondary"}
      className={cn(
        sizeClasses[size],
        inCompare && "bg-blue-500 hover:bg-blue-600",
        className
      )}
      onClick={handleClick}
    >
      {inCompare ? (
        <>
          <Check className="mr-1.5 h-4 w-4" />
          Đã thêm so sánh
        </>
      ) : (
        <>
          <GitCompareArrows className="mr-1.5 h-4 w-4" />
          Thêm so sánh
        </>
      )}
    </Button>
  )
}
