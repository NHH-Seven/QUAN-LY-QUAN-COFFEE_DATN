"use client"

import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the skeleton
   */
  width?: string | number
  /**
   * Height of the skeleton
   */
  height?: string | number
}

/**
 * Skeleton component for loading states
 * Hiển thị placeholder animation khi đang tải dữ liệu
 */
function Skeleton({ className, width, height, style, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded bg-muted", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        ...style,
      }}
      {...props}
    />
  )
}

/**
 * Table skeleton for admin data tables
 * Hiển thị skeleton cho bảng dữ liệu
 */
function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[120px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

/**
 * Card skeleton for detail pages
 * Hiển thị skeleton cho card
 */
function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border bg-card p-6 shadow-sm", className)}>
      <div className="space-y-4">
        <Skeleton className="h-5 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </div>
  )
}

/**
 * Page header skeleton
 * Hiển thị skeleton cho header trang
 */
function PageHeaderSkeleton() {
  return (
    <div className="flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  )
}

export { Skeleton, TableSkeleton, CardSkeleton, PageHeaderSkeleton }
