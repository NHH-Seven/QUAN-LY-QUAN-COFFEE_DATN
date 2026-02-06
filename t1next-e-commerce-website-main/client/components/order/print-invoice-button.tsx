"use client"

import { useState } from "react"
import { Printer, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface PrintInvoiceButtonProps {
  orderId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function PrintInvoiceButton({ orderId, variant = "outline", size = "default" }: PrintInvoiceButtonProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handlePrint = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/invoice/${orderId}/html`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!res.ok) {
        throw new Error('Failed to get invoice')
      }

      const html = await res.text()
      
      // Open print window
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(html)
        printWindow.document.close()
        printWindow.focus()
        
        // Wait for content to load then print
        setTimeout(() => {
          printWindow.print()
        }, 500)
      } else {
        toast({
          title: "Không thể mở cửa sổ in",
          description: "Vui lòng cho phép popup trong trình duyệt",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Print invoice error:', error)
      toast({
        title: "Lỗi",
        description: "Không thể in hóa đơn",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handlePrint} disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Printer className="h-4 w-4" />
      )}
      {size !== "icon" && <span className="ml-2">In hóa đơn</span>}
    </Button>
  )
}
