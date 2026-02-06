"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"

export interface RevenueChartData {
  date: string
  revenue: number
  orders: number
  items: number
}

export interface RevenueSummary {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  avgOrderValue: number
  revenueGrowth: number
  prevRevenue: number
}

export interface RevenueReportData {
  chart: RevenueChartData[]
  summary: RevenueSummary
  period: {
    from: string
    to: string
    groupBy: string
  }
}

export interface UseRevenueReportParams {
  from?: string
  to?: string
  groupBy?: "day" | "week" | "month"
  categories?: string
  statuses?: string
  paymentMethods?: string
}

interface UseRevenueReportReturn {
  data: RevenueReportData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook để fetch revenue report data với filters
 * Validates: Requirements 5.1, 5.2, 5.3
 */
export function useRevenueReport(
  params: UseRevenueReportParams = {}
): UseRevenueReportReturn {
  const [data, setData] = useState<RevenueReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const queryParams: Record<string, string> = {}
      if (params.from) queryParams.from = params.from
      if (params.to) queryParams.to = params.to
      if (params.groupBy) queryParams.groupBy = params.groupBy
      if (params.categories) queryParams.categories = params.categories
      if (params.statuses) queryParams.statuses = params.statuses
      if (params.paymentMethods) queryParams.paymentMethods = params.paymentMethods

      const response = await api.getRevenueReport(queryParams)
      
      if (response.data) {
        setData(response.data)
      } else {
        setData(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu báo cáo doanh thu")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [params.from, params.to, params.groupBy, params.categories, params.statuses, params.paymentMethods])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
