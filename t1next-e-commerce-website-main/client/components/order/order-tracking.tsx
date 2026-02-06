"use client"

import { useState, useEffect } from "react"
import { Package, Truck, ExternalLink, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

interface TrackingInfo {
  trackingCode: string | null
  shippingCarrier: string | null
  carrierName: string | null
  trackingUrl: string | null
  status: string
}

interface OrderTrackingProps {
  orderId: string
  initialTracking?: TrackingInfo
}

export function OrderTracking({ orderId, initialTracking }: OrderTrackingProps) {
  const [tracking, setTracking] = useState<TrackingInfo | null>(initialTracking || null)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!initialTracking) {
      fetchTracking()
    }
  }, [orderId, initialTracking])

  const fetchTracking = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/tracking/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success) {
        setTracking(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch tracking:', error)
    }
  }

  const copyTrackingCode = () => {
    if (tracking?.trackingCode) {
      navigator.clipboard.writeText(tracking.trackingCode)
      setCopied(true)
      toast({ title: "Đã sao chép mã vận đơn" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!tracking?.trackingCode) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <Package className="h-5 w-5" />
            <span>Chưa có thông tin vận chuyển</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-4 w-4" />
          Thông tin vận chuyển
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Đơn vị vận chuyển</span>
          <Badge variant="outline">{tracking.carrierName || tracking.shippingCarrier}</Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Mã vận đơn</span>
          <div className="flex items-center gap-2">
            <code className="bg-muted px-2 py-1 rounded text-sm font-mono">
              {tracking.trackingCode}
            </code>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={copyTrackingCode}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {tracking.trackingUrl && (
          <Button variant="outline" className="w-full" asChild>
            <a href={tracking.trackingUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Theo dõi đơn hàng
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
