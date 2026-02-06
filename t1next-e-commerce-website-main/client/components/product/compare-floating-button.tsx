"use client"

import Link from "next/link"
import { GitCompareArrows } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useCompare } from "@/contexts/compare-context"

export function CompareFloatingButton() {
  const { compareCount } = useCompare()

  if (compareCount === 0) return null

  return (
    <Link href="/compare">
      <Button
        size="lg"
        className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg h-14 w-14 p-0"
      >
        <GitCompareArrows className="h-6 w-6" />
        <Badge 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          variant="destructive"
        >
          {compareCount}
        </Badge>
      </Button>
    </Link>
  )
}
