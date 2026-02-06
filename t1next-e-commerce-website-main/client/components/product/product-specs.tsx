"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProductSpecsProps {
  specs: Record<string, string>
}

export function ProductSpecs({ specs }: ProductSpecsProps) {
  const [expanded, setExpanded] = useState(false)
  // Filter out internal fields (_colors, _variants)
  const entries = Object.entries(specs || {}).filter(([key]) => !key.startsWith('_'))
  
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Thông số kỹ thuật</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm">Chưa có thông số kỹ thuật</p>
        </CardContent>
      </Card>
    )
  }
  
  const visibleSpecs = expanded ? entries : entries.slice(0, 6)
  const hasMore = entries.length > 6

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Thông số kỹ thuật</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="divide-y">
          {visibleSpecs.map(([key, value], index) => (
            <div 
              key={key} 
              className={`flex py-3 text-sm ${index % 2 === 0 ? 'bg-muted/30' : ''} -mx-6 px-6`}
            >
              <span className="w-1/3 text-muted-foreground">{key}</span>
              <span className="w-2/3 font-medium">{value}</span>
            </div>
          ))}
        </div>
        
        {hasMore && (
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-primary"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Thu gọn <ChevronUp className="ml-1 h-4 w-4" /></>
            ) : (
              <>Xem thêm {entries.length - 6} thông số <ChevronDown className="ml-1 h-4 w-4" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
