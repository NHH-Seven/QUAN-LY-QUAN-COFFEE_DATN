"use client"

import { useState, useEffect, useCallback } from "react"
import { api } from "@/lib/api"

export interface OrderStatusData {
  status: string
  name: string
  color: string
  totalOrders: number
  totalRevenue: number
}

export interface PaymentMethodData {
  method: string
  name: string
  totalOrders: number
  totalRevenue: number
  percentage: number
}

export interface OrderReportData {
  orderStatus: OrderStatusData[]
  paymentMethods: PaymentMethodData[]
  totalOrders: number
  totalRevenue: number
  avgOrderValue: number
}

export interface UseOrderReportParams {
  from?: string
  to?: string
  categories?: string
  statuses?: string
  paymentMethods?: string
}

interface UseOrderReportReturn {
  data: OrderReportData | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook để fetch order report data với filters
 * Validates: Requirements 6.1, 6.2, 6.3
 */
export function useOrderReport(
  params: UseOrderReportParams = {}
): UseOrderReportReturn {
  const [data, setData] = useState<OrderReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const queryParams: Record<string, string> = {}
      if (params.from) queryParams.from = params.from
      if (params.to) queryParams.to = params.to
      if (params.categories) queryParams.categories = params.categories
      if (params.statuses) queryParams.statuses = params.statuses
      if (params.paymentMethods) queryParams.paymentMethods = params.paymentMethods

      // Fetch both order status and payment methods in parallel
      const [orderStatusRes, paymentMethodsRes] = await Promise.all([
        api.getOrderStatusReport(queryParams),
        api.getPaymentMethodsReport(queryParams),
      ])

      const orderStatus = orderStatusRes.data || []
      const paymentMethods = paymentMethodsRes.data || []

      // Calculate totals from order status data
      const totalOrders = orderStatus.reduce((sum, s) => sum + s.totalOrders, 0)
      const totalRevenue = orderStatus.reduce((sum, s) => sum + s.totalRevenue, 0)
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      setData({
        orderStatus,
        paymentMethods,
        totalOrders,
        totalRevenue,
        avgOrderValue,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu báo cáo đơn hàng")
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }, [params.from, params.to, params.categories, params.statuses, params.paymentMethods])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
