"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"

// Order status options
export const ORDER_STATUS_OPTIONS = [
  { value: "pending", label: "Chờ xử lý" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "shipping", label: "Đang giao" },
  { value: "delivered", label: "Đã giao" },
  { value: "cancelled", label: "Đã hủy" },
] as const

// Payment method options
export const PAYMENT_METHOD_OPTIONS = [
  { value: "cod", label: "COD" },
  { value: "bank_transfer", label: "Chuyển khoản" },
] as const

export interface Category {
  id: string
  name: string
}

export interface ReportFiltersState {
  categories: string[]
  statuses: string[]
  paymentMethods: string[]
}

interface MultiSelectProps {
  options: readonly { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder: string
  className?: string
}

function MultiSelect({ options, selected, onChange, placeholder, className }: MultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedLabels = selected
    .map(v => options.find(o => o.value === v)?.label)
    .filter(Boolean)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[160px]", className)}
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : selected.length === 1
              ? selectedLabels[0]
              : `${selected.length} đã chọn`}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-2" align="start">
        <div className="space-y-1">
          {options.map((option) => (
            <div
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
              onClick={() => handleToggle(option.value)}
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}


interface CategoryMultiSelectProps {
  categories: Category[]
  selected: string[]
  onChange: (selected: string[]) => void
  className?: string
}

function CategoryMultiSelect({ categories, selected, onChange, className }: CategoryMultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleToggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(v => v !== id))
    } else {
      onChange([...selected, id])
    }
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  const selectedNames = selected
    .map(id => categories.find(c => c.id === id)?.name)
    .filter(Boolean)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[160px]", className)}
        >
          <span className="truncate">
            {selected.length === 0
              ? "Tất cả danh mục"
              : selected.length === 1
              ? selectedNames[0]
              : `${selected.length} danh mục`}
          </span>
          <div className="flex items-center gap-1 ml-2">
            {selected.length > 0 && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100"
                onClick={handleClear}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-2 max-h-[300px] overflow-y-auto" align="start">
        <div className="space-y-1">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-accent cursor-pointer"
              onClick={() => handleToggle(category.id)}
            >
              <Checkbox
                checked={selected.includes(category.id)}
                onCheckedChange={() => handleToggle(category.id)}
              />
              <span className="text-sm">{category.name}</span>
            </div>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-2">
              Không có danh mục
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface ReportFiltersProps {
  categories: Category[]
  filters: ReportFiltersState
  onChange: (filters: ReportFiltersState) => void
  className?: string
}

export function ReportFilters({ categories, filters, onChange, className }: ReportFiltersProps) {
  const handleCategoriesChange = (selected: string[]) => {
    onChange({ ...filters, categories: selected })
  }

  const handleStatusesChange = (selected: string[]) => {
    onChange({ ...filters, statuses: selected })
  }

  const handlePaymentMethodsChange = (selected: string[]) => {
    onChange({ ...filters, paymentMethods: selected })
  }

  const handleClearAll = () => {
    onChange({ categories: [], statuses: [], paymentMethods: [] })
  }

  const hasFilters = filters.categories.length > 0 || 
                     filters.statuses.length > 0 || 
                     filters.paymentMethods.length > 0

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <CategoryMultiSelect
        categories={categories}
        selected={filters.categories}
        onChange={handleCategoriesChange}
      />
      
      <MultiSelect
        options={ORDER_STATUS_OPTIONS}
        selected={filters.statuses}
        onChange={handleStatusesChange}
        placeholder="Tất cả trạng thái"
      />
      
      <MultiSelect
        options={PAYMENT_METHOD_OPTIONS}
        selected={filters.paymentMethods}
        onChange={handlePaymentMethodsChange}
        placeholder="Tất cả thanh toán"
      />

      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearAll}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4 mr-1" />
          Xóa bộ lọc
        </Button>
      )}

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex flex-wrap gap-1 ml-2">
          {filters.categories.map(id => {
            const cat = categories.find(c => c.id === id)
            return cat ? (
              <Badge key={id} variant="secondary" className="text-xs">
                {cat.name}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => handleCategoriesChange(filters.categories.filter(c => c !== id))}
                />
              </Badge>
            ) : null
          })}
          {filters.statuses.map(status => {
            const opt = ORDER_STATUS_OPTIONS.find(o => o.value === status)
            return opt ? (
              <Badge key={status} variant="secondary" className="text-xs">
                {opt.label}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => handleStatusesChange(filters.statuses.filter(s => s !== status))}
                />
              </Badge>
            ) : null
          })}
          {filters.paymentMethods.map(method => {
            const opt = PAYMENT_METHOD_OPTIONS.find(o => o.value === method)
            return opt ? (
              <Badge key={method} variant="secondary" className="text-xs">
                {opt.label}
                <X
                  className="h-3 w-3 ml-1 cursor-pointer"
                  onClick={() => handlePaymentMethodsChange(filters.paymentMethods.filter(m => m !== method))}
                />
              </Badge>
            ) : null
          })}
        </div>
      )}
    </div>
  )
}

export { CategoryMultiSelect, MultiSelect }
