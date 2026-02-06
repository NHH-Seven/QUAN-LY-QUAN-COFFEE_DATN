"use client"

import { useMemo } from "react"
import { Check, X, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { Product } from "@/lib/types"

interface SpecsDiffProps {
  products: Product[]
}

interface SpecRow {
  key: string
  label: string
  values: (string | undefined)[]
  isDifferent: boolean
}

/**
 * Detect differences between product specs
 * Returns an object with spec keys and whether they differ
 */
export function detectSpecDifferences(
  products: Array<{ specs?: Record<string, string> }>
): Record<string, boolean> {
  if (products.length < 2) return {}

  const allKeys = new Set<string>()
  products.forEach((p) => {
    if (p.specs) {
      Object.keys(p.specs).forEach((key) => allKeys.add(key))
    }
  })

  const differences: Record<string, boolean> = {}

  allKeys.forEach((key) => {
    const values = products.map((p) => p.specs?.[key])
    const uniqueValues = new Set(values.filter((v) => v !== undefined))
    // Different if more than one unique value, or if some products have the spec and others don't
    const hasUndefined = values.some((v) => v === undefined)
    const hasDefined = values.some((v) => v !== undefined)
    differences[key] = uniqueValues.size > 1 || (hasUndefined && hasDefined)
  })

  return differences
}

/**
 * Format spec key to human-readable label
 */
function formatSpecLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
}

/**
 * SpecsDiff component
 * Displays product specifications in a comparison table
 * Highlights differences between products
 */
export function SpecsDiff({ products }: SpecsDiffProps) {
  const specRows = useMemo<SpecRow[]>(() => {
    if (products.length === 0) return []

    // Collect all unique spec keys
    const allKeys = new Set<string>()
    products.forEach((p) => {
      if (p.specs) {
        Object.keys(p.specs).forEach((key) => allKeys.add(key))
      }
    })

    // Detect differences
    const differences = detectSpecDifferences(products)

    // Build rows
    const rows: SpecRow[] = Array.from(allKeys).map((key) => ({
      key,
      label: formatSpecLabel(key),
      values: products.map((p) => p.specs?.[key]),
      isDifferent: differences[key] || false,
    }))

    // Sort: different specs first, then alphabetically
    rows.sort((a, b) => {
      if (a.isDifferent !== b.isDifferent) {
        return a.isDifferent ? -1 : 1
      }
      return a.label.localeCompare(b.label)
    })

    return rows
  }, [products])

  // Basic info rows (always shown)
  const basicInfoRows = useMemo(() => {
    const rows = [
      {
        label: "Thương hiệu",
        values: products.map((p) => p.brand),
        isDifferent: new Set(products.map((p) => p.brand)).size > 1,
      },
      {
        label: "Đánh giá",
        values: products.map((p) => `${p.rating}/5 (${p.reviewCount} đánh giá)`),
        isDifferent: false,
      },
      {
        label: "Tình trạng",
        values: products.map((p) =>
          p.stock > 10 ? "Còn hàng" : p.stock > 0 ? `Còn ${p.stock}` : "Hết hàng"
        ),
        isDifferent: false,
      },
    ]
    return rows
  }, [products])

  if (products.length < 2) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Thêm ít nhất 2 sản phẩm để so sánh thông số
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          So sánh thông số
          <span className="text-sm font-normal text-muted-foreground">
            (Khác biệt được đánh dấu)
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium w-1/5">Thông số</th>
                {products.map((product) => (
                  <th key={product.id} className="text-left p-4 font-medium">
                    {product.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Basic info */}
              {basicInfoRows.map((row, index) => (
                <tr
                  key={`basic-${index}`}
                  className={cn(
                    "border-b",
                    row.isDifferent && "bg-yellow-50 dark:bg-yellow-950/20"
                  )}
                >
                  <td className="p-4 font-medium text-muted-foreground">
                    {row.label}
                  </td>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={cn(
                        "p-4",
                        row.isDifferent && "font-medium text-yellow-700 dark:text-yellow-400"
                      )}
                    >
                      {value || <Minus className="h-4 w-4 text-muted-foreground" />}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Separator */}
              {specRows.length > 0 && (
                <tr className="bg-muted">
                  <td colSpan={products.length + 1} className="p-2 text-sm font-medium">
                    Thông số kỹ thuật
                  </td>
                </tr>
              )}

              {/* Spec rows */}
              {specRows.map((row) => (
                <tr
                  key={row.key}
                  className={cn(
                    "border-b",
                    row.isDifferent && "bg-yellow-50 dark:bg-yellow-950/20"
                  )}
                >
                  <td className="p-4 font-medium text-muted-foreground">
                    {row.label}
                    {row.isDifferent && (
                      <span className="ml-2 text-xs text-yellow-600 dark:text-yellow-400">
                        (khác)
                      </span>
                    )}
                  </td>
                  {row.values.map((value, i) => (
                    <td
                      key={i}
                      className={cn(
                        "p-4",
                        row.isDifferent && value && "font-medium text-yellow-700 dark:text-yellow-400"
                      )}
                    >
                      {value ? (
                        // Check if it's a boolean-like value
                        value.toLowerCase() === "yes" || value.toLowerCase() === "có" ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : value.toLowerCase() === "no" || value.toLowerCase() === "không" ? (
                          <X className="h-4 w-4 text-red-500" />
                        ) : (
                          value
                        )
                      ) : (
                        <Minus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}

              {/* No specs message */}
              {specRows.length === 0 && (
                <tr>
                  <td
                    colSpan={products.length + 1}
                    className="p-8 text-center text-muted-foreground"
                  >
                    Không có thông số kỹ thuật để so sánh
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
