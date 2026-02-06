"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

/**
 * Skeleton loading state cho StatsCard
 */
export function StatsCardSkeleton() {
  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
      </CardHeader>
      <CardContent>
        <div className="h-8 w-32 animate-pulse rounded bg-muted" />
        <div className="h-3 w-20 animate-pulse rounded bg-muted mt-2" />
      </CardContent>
    </Card>
  )
}
