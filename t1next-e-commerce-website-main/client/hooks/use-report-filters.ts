"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { DateRangeValue, DatePreset } from "@/components/reports/date-range-picker"
import { getPresetDateRange } from "@/components/reports/date-range-picker"
import type { ReportFiltersState } from "@/components/reports/report-filters"

const STORAGE_KEY = "report-filters"
const DATE_STORAGE_KEY = "report-date-range"

interface UseReportFiltersOptions {
  syncUrl?: boolean
  persistToStorage?: boolean
}

interface ReportFiltersHookState {
  dateRange: DateRangeValue
  filters: ReportFiltersState
}

interface UseReportFiltersReturn {
  dateRange: DateRangeValue
  filters: ReportFiltersState
  setDateRange: (value: DateRangeValue) => void
  setFilters: (filters: ReportFiltersState) => void
  setCategories: (categories: string[]) => void
  setStatuses: (statuses: string[]) => void
  setPaymentMethods: (paymentMethods: string[]) => void
  clearFilters: () => void
  clearAll: () => void
  queryParams: Record<string, string>
}

function getDefaultDateRange(): DateRangeValue {
  const range = getPresetDateRange("last30days")
  return { ...range, preset: "last30days" }
}

function getDefaultFilters(): ReportFiltersState {
  return {
    categories: [],
    statuses: [],
    paymentMethods: [],
  }
}

function loadFromStorage(): ReportFiltersHookState | null {
  if (typeof window === "undefined") return null
  try {
    // Load date range
    const dateStored = sessionStorage.getItem(DATE_STORAGE_KEY)
    let dateRange: DateRangeValue | null = null
    if (dateStored) {
      const parsed = JSON.parse(dateStored)
      dateRange = {
        from: new Date(parsed.from),
        to: new Date(parsed.to),
        preset: parsed.preset as DatePreset,
      }
    }

    // Load filters
    const filtersStored = sessionStorage.getItem(STORAGE_KEY)
    let filters: ReportFiltersState | null = null
    if (filtersStored) {
      filters = JSON.parse(filtersStored)
    }

    if (!dateRange && !filters) return null

    return {
      dateRange: dateRange || getDefaultDateRange(),
      filters: filters || getDefaultFilters(),
    }
  } catch {
    return null
  }
}


function saveToStorage(state: ReportFiltersHookState): void {
  if (typeof window === "undefined") return
  try {
    // Save date range
    sessionStorage.setItem(DATE_STORAGE_KEY, JSON.stringify({
      from: state.dateRange.from.toISOString(),
      to: state.dateRange.to.toISOString(),
      preset: state.dateRange.preset,
    }))

    // Save filters
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state.filters))
  } catch {
    // Ignore storage errors
  }
}

function parseUrlParams(searchParams: URLSearchParams): Partial<ReportFiltersHookState> {
  const result: Partial<ReportFiltersHookState> = {}

  // Parse date range
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  const preset = searchParams.get("preset") as DatePreset | null

  if (from && to) {
    result.dateRange = {
      from: new Date(from),
      to: new Date(to),
      preset: preset || "custom",
    }
  } else if (preset && preset !== "custom") {
    const range = getPresetDateRange(preset)
    result.dateRange = { ...range, preset }
  }

  // Parse filters
  const categories = searchParams.get("categories")
  const statuses = searchParams.get("statuses")
  const paymentMethods = searchParams.get("paymentMethods")

  if (categories || statuses || paymentMethods) {
    result.filters = {
      categories: categories ? categories.split(",").filter(Boolean) : [],
      statuses: statuses ? statuses.split(",").filter(Boolean) : [],
      paymentMethods: paymentMethods ? paymentMethods.split(",").filter(Boolean) : [],
    }
  }

  return result
}

function buildUrlParams(state: ReportFiltersHookState): URLSearchParams {
  const params = new URLSearchParams()

  // Add date range
  params.set("from", state.dateRange.from.toISOString())
  params.set("to", state.dateRange.to.toISOString())
  if (state.dateRange.preset !== "custom") {
    params.set("preset", state.dateRange.preset)
  }

  // Add filters
  if (state.filters.categories.length > 0) {
    params.set("categories", state.filters.categories.join(","))
  }
  if (state.filters.statuses.length > 0) {
    params.set("statuses", state.filters.statuses.join(","))
  }
  if (state.filters.paymentMethods.length > 0) {
    params.set("paymentMethods", state.filters.paymentMethods.join(","))
  }

  return params
}

export function useReportFilters(
  options: UseReportFiltersOptions = {}
): UseReportFiltersReturn {
  const { syncUrl = true, persistToStorage = true } = options
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Initialize state
  const [state, setState] = useState<ReportFiltersHookState>(() => {
    // Priority: URL params > Session storage > Defaults
    if (syncUrl && searchParams.toString()) {
      const urlState = parseUrlParams(searchParams)
      if (urlState.dateRange || urlState.filters) {
        return {
          dateRange: urlState.dateRange || getDefaultDateRange(),
          filters: urlState.filters || getDefaultFilters(),
        }
      }
    }

    const stored = loadFromStorage()
    if (stored) return stored

    return {
      dateRange: getDefaultDateRange(),
      filters: getDefaultFilters(),
    }
  })

  // Sync to URL when state changes
  useEffect(() => {
    if (!syncUrl) return

    const params = buildUrlParams(state)
    const newUrl = `${pathname}?${params.toString()}`
    
    // Only update if URL actually changed
    const currentParams = searchParams.toString()
    if (params.toString() !== currentParams) {
      router.replace(newUrl, { scroll: false })
    }
  }, [state, syncUrl, pathname, router, searchParams])

  // Persist to storage when state changes
  useEffect(() => {
    if (persistToStorage) {
      saveToStorage(state)
    }
  }, [state, persistToStorage])

  const setDateRange = useCallback((dateRange: DateRangeValue) => {
    setState(prev => ({ ...prev, dateRange }))
  }, [])

  const setFilters = useCallback((filters: ReportFiltersState) => {
    setState(prev => ({ ...prev, filters }))
  }, [])

  const setCategories = useCallback((categories: string[]) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, categories },
    }))
  }, [])

  const setStatuses = useCallback((statuses: string[]) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, statuses },
    }))
  }, [])

  const setPaymentMethods = useCallback((paymentMethods: string[]) => {
    setState(prev => ({
      ...prev,
      filters: { ...prev.filters, paymentMethods },
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setState(prev => ({
      ...prev,
      filters: getDefaultFilters(),
    }))
  }, [])

  const clearAll = useCallback(() => {
    setState({
      dateRange: getDefaultDateRange(),
      filters: getDefaultFilters(),
    })
  }, [])

  // Build query params for API calls
  const queryParams = useMemo(() => {
    const params: Record<string, string> = {
      from: state.dateRange.from.toISOString(),
      to: state.dateRange.to.toISOString(),
    }

    if (state.filters.categories.length > 0) {
      params.categories = state.filters.categories.join(",")
    }
    if (state.filters.statuses.length > 0) {
      params.statuses = state.filters.statuses.join(",")
    }
    if (state.filters.paymentMethods.length > 0) {
      params.paymentMethods = state.filters.paymentMethods.join(",")
    }

    return params
  }, [state])

  return {
    dateRange: state.dateRange,
    filters: state.filters,
    setDateRange,
    setFilters,
    setCategories,
    setStatuses,
    setPaymentMethods,
    clearFilters,
    clearAll,
    queryParams,
  }
}
