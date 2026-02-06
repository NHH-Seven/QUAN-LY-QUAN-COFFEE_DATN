/**
 * Category Icons
 * Mapping từ category icon name sang Lucide icon component
 */

import type React from "react"
import {
  Coffee,
  Leaf,
  Snowflake,
  Citrus,
  Cake,
  Cookie,
  Package,
  Bean,
  Cup,
} from "lucide-react"

/** Icon mapping cho các category */
export const categoryIcons: Record<string, React.ReactNode> = {
  coffee: <Coffee className="h-4 w-4" />,
  leaf: <Leaf className="h-4 w-4" />,
  snowflake: <Snowflake className="h-4 w-4" />,
  citrus: <Citrus className="h-4 w-4" />,
  cake: <Cake className="h-4 w-4" />,
  cookie: <Cookie className="h-4 w-4" />,
  package: <Package className="h-4 w-4" />,
  bean: <Bean className="h-4 w-4" />,
}

/**
 * Lấy icon cho category
 * @param iconName - Tên icon từ category data
 * @returns React node của icon hoặc null
 */
export function getCategoryIcon(iconName: string | undefined): React.ReactNode {
  if (!iconName) return null
  return categoryIcons[iconName] || null
}
