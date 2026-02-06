"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth, subMonths, startOfQuarter, startOfYear } from "date-fns"
import { vi } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type DatePreset = 
  | "today" 
  | "last7days" 
  | "last30days" 
  | "thisMonth" 
  | "lastMonth" 
  | "thisQuarter" 
  | "thisYear"
  | "custom"

export interface DateRangeValue {
  from: Date
  to: Date
  preset: DatePreset
}

interface DateRangePickerProps {
  value?: DateRangeValue
  onChange?: (value: DateRangeValue) => void
  className?: string
}

const STORAGE_KEY = "report-date-range"

const presetLabels: Record<DatePreset, string> = {
  today: "Hôm nay",
  last7days: "7 ngày qua",
  last30days: "30 ngày qua",
  thisMonth: "Tháng này",
  lastMonth: "Tháng trước",
  thisQuarter: "Quý này",
  thisYear: "Năm nay",
  custom: "Tùy chọn",
}

function getPresetDateRange(preset: DatePreset): { from: Date; to: Date } {
  const today = new Date()
  today.setHours(23, 59, 59, 999)
  
  switch (preset) {
    case "today":
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      return { from: todayStart, to: today }
    case "last7days":
      return { from: subDays(today, 6), to: today }
    case "last30days":
      return { from: subDays(today, 29), to: today }
    case "thisMonth":
      return { from: startOfMonth(today), to: today }
    case "lastMonth":
      const lastMonth = subMonths(today, 1)
      return { from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) }
    case "thisQuarter":
      return { from: startOfQuarter(today), to: today }
    case "thisYear":
      return { from: startOfYear(today), to: today }
    default:
      return { from: subDays(today, 29), to: today }
  }
}


function loadFromStorage(): DateRangeValue | null {
  if (typeof window === "undefined") return null
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    const parsed = JSON.parse(stored)
    return {
      from: new Date(parsed.from),
      to: new Date(parsed.to),
      preset: parsed.preset as DatePreset,
    }
  } catch {
    return null
  }
}

function saveToStorage(value: DateRangeValue): void {
  if (typeof window === "undefined") return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      from: value.from.toISOString(),
      to: value.to.toISOString(),
      preset: value.preset,
    }))
  } catch {
    // Ignore storage errors
  }
}

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date>(new Date())
  const [internalValue, setInternalValue] = React.useState<DateRangeValue>(() => {
    const defaultRange = getPresetDateRange("last7days")
    return { ...defaultRange, preset: "last7days" }
  })

  // Load from storage on mount
  React.useEffect(() => {
    const stored = loadFromStorage()
    if (stored) {
      setInternalValue(stored)
      setMonth(stored.to)
    }
  }, [])

  const currentValue = value ?? internalValue

  const handlePresetSelect = (preset: DatePreset) => {
    if (preset === "custom") return
    const range = getPresetDateRange(preset)
    const newValue: DateRangeValue = { ...range, preset }
    setInternalValue(newValue)
    setMonth(range.to)
    saveToStorage(newValue)
    onChange?.(newValue)
    setOpen(false)
  }

  const handleCalendarSelect = (range: DateRange | undefined) => {
    if (!range?.from) return
    const newValue: DateRangeValue = {
      from: range.from,
      to: range.to ?? range.from,
      preset: "custom",
    }
    setInternalValue(newValue)
    saveToStorage(newValue)
    onChange?.(newValue)
  }

  const formatDateRange = () => {
    if (currentValue.preset !== "custom") {
      return presetLabels[currentValue.preset]
    }
    return `${format(currentValue.from, "dd/MM/yyyy")} - ${format(currentValue.to, "dd/MM/yyyy")}`
  }

  // Reset month to current when opening
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setMonth(currentValue.to)
    }
    setOpen(isOpen)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal min-w-[200px]",
            !currentValue && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-0" 
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <div className="flex">
          {/* Preset options */}
          <div className="border-r p-2 flex flex-col gap-1">
            {(Object.keys(presetLabels) as DatePreset[])
              .filter(p => p !== "custom")
              .map((preset) => (
                <button
                  key={preset}
                  className={cn(
                    "text-left text-sm px-3 py-1.5 rounded hover:bg-accent transition-colors whitespace-nowrap",
                    currentValue.preset === preset && "bg-primary text-primary-foreground hover:bg-primary"
                  )}
                  onClick={() => handlePresetSelect(preset)}
                >
                  {presetLabels[preset]}
                </button>
              ))}
          </div>
          {/* Calendar */}
          <div className="p-2">
            <Calendar
              mode="range"
              month={month}
              onMonthChange={setMonth}
              selected={{ from: currentValue.from, to: currentValue.to }}
              onSelect={handleCalendarSelect}
              numberOfMonths={1}
              locale={vi}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

export { getPresetDateRange, presetLabels }
