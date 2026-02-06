/**
 * Logo Component
 * Logo NHH-Coffee thống nhất cho toàn bộ ứng dụng
 */

import Link from "next/link"
import { Coffee } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoProps {
  /** Hiển thị text bên cạnh icon */
  showText?: boolean
  /** Variant màu sắc */
  variant?: "default" | "white" | "primary"
  /** Size của logo */
  size?: "sm" | "md" | "lg"
  /** Custom className */
  className?: string
  /** Có link về trang chủ không */
  asLink?: boolean
}

const sizeConfig = {
  sm: { icon: "h-5 w-5", text: "text-sm", gap: "gap-1.5", container: "h-7 w-7" },
  md: { icon: "h-5 w-5", text: "text-lg", gap: "gap-2", container: "h-9 w-9" },
  lg: { icon: "h-6 w-6", text: "text-2xl", gap: "gap-2", container: "h-10 w-10" },
}

export function Logo({
  showText = true,
  variant = "default",
  size = "md",
  className,
  asLink = true,
}: LogoProps) {
  const config = sizeConfig[size]
  
  const content = (
    <div className={cn("flex items-center", config.gap, className)}>
      {/* Coffee Icon */}
      <div className={cn(
        "flex items-center justify-center rounded-full",
        config.container,
        variant === "white" ? "bg-white" : "bg-primary/10"
      )}>
        <Coffee className={cn(
          config.icon,
          variant === "white" && "text-primary",
          variant === "default" && "text-primary",
          variant === "primary" && "text-primary"
        )} />
      </div>

      {/* Text "NHH-Coffee" */}
      {showText && (
        <span
          className={cn(
            "font-bold tracking-tight",
            config.text,
            variant === "white" && "text-white",
            variant === "default" && "text-foreground",
            variant === "primary" && "text-primary"
          )}
        >
          NHH-Coffee
        </span>
      )}
    </div>
  )

  if (asLink) {
    return <Link href="/">{content}</Link>
  }

  return content
}
