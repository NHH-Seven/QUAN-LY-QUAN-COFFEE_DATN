"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileSpreadsheet, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type ExportType = "revenue" | "orders" | "products" | "categories"

interface ExportOption {
  type: ExportType
  label: string
  description: string
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    type: "revenue",
    label: "Báo cáo doanh thu",
    description: "Doanh thu theo thời gian",
  },
  {
    type: "orders",
    label: "Báo cáo đơn hàng",
    description: "Chi tiết đơn hàng",
  },
  {
    type: "products",
    label: "Top sản phẩm",
    description: "Sản phẩm bán chạy",
  },
  {
    type: "categories",
    label: "Doanh thu danh mục",
    description: "Theo danh mục sản phẩm",
  },
]

interface ExportButtonProps {
  onExport: (type: ExportType) => Promise<void>
  disabled?: boolean
  className?: string
}

export function ExportButton({
  onExport,
  disabled,
  className,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [exportingType, setExportingType] = useState<ExportType | null>(null)

  const handleExport = async (type: ExportType) => {
    if (isExporting) return

    setIsExporting(true)
    setExportingType(type)

    try {
      await onExport(type)
    } finally {
      setIsExporting(false)
      setExportingType(null)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || isExporting}
          className={cn("gap-2", className)}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          Xuất báo cáo
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Xuất Excel
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EXPORT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleExport(option.type)}
            disabled={isExporting}
            className="flex flex-col items-start gap-0.5 cursor-pointer"
          >
            <span className="font-medium flex items-center gap-2">
              {exportingType === option.type && (
                <Loader2 className="h-3 w-3 animate-spin" />
              )}
              {option.label}
            </span>
            <span className="text-xs text-muted-foreground">
              {option.description}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
