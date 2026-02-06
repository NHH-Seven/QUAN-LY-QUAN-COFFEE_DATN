"use client"

import { Banknote, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type PaymentMethod = "cod" | "bank_transfer"

interface PaymentMethodSelectorProps {
  value: PaymentMethod
  onChange: (value: PaymentMethod) => void
  error?: string
  disabled?: boolean
}

/**
 * PaymentMethodSelector component
 * Radio buttons for COD and Bank Transfer
 * Show instructions based on selection
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4
 */
export function PaymentMethodSelector({
  value,
  onChange,
  error,
  disabled
}: PaymentMethodSelectorProps) {
  return (
    <Card>
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="text-base sm:text-lg">
          Phương thức thanh toán <span className="text-destructive">*</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6 pt-0">
        {/* COD Option (Requirement 3.1, 3.2) */}
        <PaymentOption
          id="cod"
          label="Thanh toán khi nhận hàng (COD)"
          description="Thanh toán bằng tiền mặt khi nhận hàng"
          icon={<Banknote className="h-5 w-5" />}
          selected={value === "cod"}
          onSelect={() => onChange("cod")}
          disabled={disabled}
        />

        {/* Bank Transfer Option (Requirement 3.1, 3.3) */}
        <PaymentOption
          id="bank_transfer"
          label="Chuyển khoản ngân hàng"
          description="Chuyển khoản trước khi giao hàng"
          icon={<Building2 className="h-5 w-5" />}
          selected={value === "bank_transfer"}
          onSelect={() => onChange("bank_transfer")}
          disabled={disabled}
        />

        {/* Error message */}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        {/* Payment instructions based on selection */}
        {value === "cod" && (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <h4 className="font-medium text-sm mb-2">Hướng dẫn thanh toán COD</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng</li>
              <li>• Vui lòng chuẩn bị đúng số tiền để thuận tiện cho việc giao hàng</li>
              <li>• Kiểm tra hàng trước khi thanh toán</li>
            </ul>
          </div>
        )}

        {value === "bank_transfer" && (
          <div className="mt-4 rounded-lg bg-muted p-4">
            <h4 className="font-medium text-sm mb-2">Thông tin chuyển khoản</h4>
            <div className="text-sm space-y-2">
              <p><span className="text-muted-foreground">Ngân hàng:</span> Vietcombank</p>
              <p><span className="text-muted-foreground">Số tài khoản:</span> 1234567890</p>
              <p><span className="text-muted-foreground">Chủ tài khoản:</span> NHH-COFFEE</p>
              <p><span className="text-muted-foreground">Nội dung:</span> [Mã đơn hàng] - [Tên người mua]</p>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              * Đơn hàng sẽ được xử lý sau khi chúng tôi xác nhận thanh toán
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface PaymentOptionProps {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}

function PaymentOption({
  id,
  label,
  description,
  icon,
  selected,
  onSelect,
  disabled
}: PaymentOptionProps) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
        selected 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onSelect()}
    >
      <input
        type="radio"
        id={id}
        name="paymentMethod"
        checked={selected}
        onChange={onSelect}
        disabled={disabled}
        className="mt-1 h-4 w-4 text-primary focus:ring-primary"
      />
      <div className="flex-1">
        <Label 
          htmlFor={id} 
          className="flex items-center gap-2 cursor-pointer font-medium"
        >
          {icon}
          {label}
        </Label>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </div>
  )
}
