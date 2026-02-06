"use client"

import { useState, useEffect } from "react"
import { MapPin, Plus, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { CreateCheckoutOrderData } from "@/lib/api"

interface SavedAddress {
  id: string
  name: string
  phone: string
  address: string
  is_default: boolean
}

interface CheckoutFormProps {
  formData: CreateCheckoutOrderData
  formErrors: Record<string, string>
  onFieldChange: (field: keyof CreateCheckoutOrderData, value: string) => void
  disabled?: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"

export function CheckoutForm({ 
  formData, 
  formErrors, 
  onFieldChange, 
  disabled 
}: CheckoutFormProps) {
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new")
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`${API_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      if (data.success && data.data.length > 0) {
        setSavedAddresses(data.data)
        setShowSaved(true)
        // Auto-select default address if form is empty
        const defaultAddr = data.data.find((a: SavedAddress) => a.is_default)
        if (defaultAddr && !formData.recipientName && !formData.phone && !formData.address) {
          handleSelectAddress(defaultAddr.id, data.data)
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleSelectAddress = (id: string, addresses?: SavedAddress[]) => {
    const list = addresses || savedAddresses
    setSelectedAddressId(id)
    if (id === "new") {
      // Clear form for new address
      onFieldChange("recipientName", "")
      onFieldChange("phone", "")
      onFieldChange("address", "")
    } else {
      const addr = list.find(a => a.id === id)
      if (addr) {
        onFieldChange("recipientName", addr.name)
        onFieldChange("phone", addr.phone)
        onFieldChange("address", addr.address)
      }
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <div className="px-6 pt-5 pb-3">
        <h2 className="text-xl font-semibold">Thông tin giao hàng</h2>
      </div>
      <CardContent className="p-6 pt-0 flex-1 flex flex-col">
        <div className="space-y-6">
          {/* Saved addresses selector */}
          {savedAddresses.length > 0 && (
            <Collapsible open={showSaved} onOpenChange={setShowSaved}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Địa chỉ đã lưu ({savedAddresses.length})
                  </span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${showSaved ? "rotate-180" : ""}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <RadioGroup value={selectedAddressId} onValueChange={handleSelectAddress} className="space-y-2">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAddressId === addr.id ? "border-primary bg-primary/5" : "hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={addr.id} className="mt-1" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{addr.name}</span>
                          {addr.is_default && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Mặc định</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{addr.phone}</p>
                        <p className="text-sm text-muted-foreground truncate">{addr.address}</p>
                      </div>
                    </label>
                  ))}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedAddressId === "new" ? "border-primary bg-primary/5" : "hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value="new" />
                    <Plus className="h-4 w-4" />
                    <span>Nhập địa chỉ mới</span>
                  </label>
                </RadioGroup>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Form fields - show when "new" selected or no saved addresses */}
          {(selectedAddressId === "new" || savedAddresses.length === 0) && (
            <>
              {/* Recipient Name */}
              <div className="space-y-2">
                <Label htmlFor="recipientName">
                  Tên người nhận <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="recipientName"
                  placeholder="Nhập tên người nhận hàng"
                  value={formData.recipientName}
                  onChange={(e) => onFieldChange("recipientName", e.target.value)}
                  disabled={disabled}
                  className={formErrors.recipientName ? "border-destructive" : ""}
                />
                {formErrors.recipientName && (
                  <p className="text-sm text-destructive">{formErrors.recipientName}</p>
                )}
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone">
                  Số điện thoại <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ví dụ: 0912345678"
                  value={formData.phone}
                  onChange={(e) => onFieldChange("phone", e.target.value)}
                  disabled={disabled}
                  className={formErrors.phone ? "border-destructive" : ""}
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive">{formErrors.phone}</p>
                )}
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">
                  Địa chỉ giao hàng <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="address"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                  value={formData.address}
                  onChange={(e) => onFieldChange("address", e.target.value)}
                  disabled={disabled}
                  className={formErrors.address ? "border-destructive" : ""}
                />
                {formErrors.address && (
                  <p className="text-sm text-destructive">{formErrors.address}</p>
                )}
              </div>
            </>
          )}

          {/* Show selected address summary when not "new" */}
          {selectedAddressId !== "new" && savedAddresses.length > 0 && (
            <div className="p-4 rounded-lg bg-muted/50 space-y-1">
              <p className="font-medium">{formData.recipientName}</p>
              <p className="text-sm text-muted-foreground">{formData.phone}</p>
              <p className="text-sm text-muted-foreground">{formData.address}</p>
            </div>
          )}

          {/* Note */}
          <div className="space-y-2 flex-1">
            <Label htmlFor="note">Ghi chú</Label>
            <Textarea
              id="note"
              placeholder="Ghi chú cho đơn hàng (không bắt buộc)"
              value={formData.note || ""}
              onChange={(e) => onFieldChange("note", e.target.value)}
              disabled={disabled}
              className="min-h-[100px] resize-none"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
