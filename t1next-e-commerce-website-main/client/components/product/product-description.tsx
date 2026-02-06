"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ProductDescriptionProps {
  description: string
  name: string
}

// Tách description thành các bullet points
function formatDescription(text: string): string[] {
  if (!text) return []
  
  // Tách theo dấu chấm, nhưng giữ lại các câu có nghĩa
  const sentences = text
    .split(/[.!]\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10) // Bỏ các đoạn quá ngắn
  
  return sentences
}

export function ProductDescription({ description, name }: ProductDescriptionProps) {
  const [expanded, setExpanded] = useState(false)
  const [isOverflowing, setIsOverflowing] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  const bullets = formatDescription(description)

  // Check if content overflows
  useEffect(() => {
    if (contentRef.current) {
      const isOver = contentRef.current.scrollHeight > 200
      setIsOverflowing(isOver)
    }
  }, [description])

  if (!description || bullets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Mô tả sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-muted-foreground text-sm">Chưa có mô tả sản phẩm</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Mô tả sản phẩm</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <h3 className="font-semibold mb-4">{name}</h3>
        
        <div 
          ref={contentRef}
          className={`relative ${!expanded && isOverflowing ? 'max-h-[200px] overflow-hidden' : ''}`}
        >
          <ul className="space-y-2">
            {bullets.map((bullet, index) => (
              <li key={index} className="flex gap-2 text-sm">
                <span className="text-primary mt-1.5 shrink-0">•</span>
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
          
          {!expanded && isOverflowing && (
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent" />
          )}
        </div>
        
        {isOverflowing && (
          <Button 
            variant="link" 
            className="mt-3 text-primary p-0 h-auto"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>Thu gọn <ChevronUp className="ml-1 h-4 w-4" /></>
            ) : (
              <>Xem thêm <ChevronDown className="ml-1 h-4 w-4" /></>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
