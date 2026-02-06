"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useReportFilters } from "@/hooks/use-report-filters"
import { useRevenueReport } from "@/hooks/use-revenue-report"
import { useOrderReport } from "@/hooks/use-order-report"
import { api, Category } from "@/lib/api"
import {
  DateRangePicker,
  ReportFilters,
  RevenueChart,
  OrderStatusChart,
  PaymentMethodChart,
  CategoryRevenueChart,
  ReportSummaryCards,
  TopProductsTable,
  ExportButton,
  type ExportType,
  type TopProduct,
  type CategoryRevenueData,
} from "@/components/reports"

export default function ReportsPage() {
  const { toast } = useToast()
  
  // Filter state management
  const {
    dateRange,
    filters,
    setDateRange,
    setFilters,
    queryParams,
  } = useReportFilters()

  // Categories for filter dropdown
  const [categories, setCategories] = useState<Category[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)

  // Additional report data
  const [topProducts, setTopProducts] = useState<TopProduct[]>([])
  const [categoryRevenue, setCategoryRevenue] = useState<CategoryRevenueData[]>([])
  const [additionalLoading, setAdditionalLoading] = useState(true)

  // Auto select groupBy based on date range
  const autoGroupBy = useMemo(() => {
    if (!queryParams.from || !queryParams.to) return "day"
    const from = new Date(queryParams.from)
    const to = new Date(queryParams.to)
    const days = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
    if (days > 31) return "month"  // > 1 tháng → theo tháng
    return "day"                    // <= 1 tháng → theo ngày
  }, [queryParams.from, queryParams.to])

  // Revenue report hook
  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
  } = useRevenueReport({
    from: queryParams.from,
    to: queryParams.to,
    groupBy: autoGroupBy,
    categories: queryParams.categories,
    statuses: queryParams.statuses,
    paymentMethods: queryParams.paymentMethods,
  })

  // Order report hook
  const {
    data: orderData,
    isLoading: orderLoading,
    error: orderError,
  } = useOrderReport({
    from: queryParams.from,
    to: queryParams.to,
    categories: queryParams.categories,
    statuses: queryParams.statuses,
    paymentMethods: queryParams.paymentMethods,
  })

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true)
        const response = await api.getCategories()
        if (response.data) {
          setCategories(response.data.map(c => ({ id: c.id, name: c.name })))
        }
      } catch {
        // Silently fail - categories are optional for filtering
      } finally {
        setCategoriesLoading(false)
      }
    }
    fetchCategories()
  }, [])

  // Fetch additional report data (top products, category revenue) - load independently
  useEffect(() => {
    const controller = new AbortController()
    
    const fetchTopProducts = async () => {
      try {
        const res = await api.getTopProductsReport({ ...queryParams, limit: 10 })
        setTopProducts(res.data || [])
      } catch {
        // Ignore errors
      }
    }
    
    const fetchCategoryRevenue = async () => {
      try {
        const res = await api.getTopCategoriesReport(queryParams)
        setCategoryRevenue(res.data || [])
      } catch {
        // Ignore errors
      }
    }
    
    setAdditionalLoading(true)
    Promise.all([fetchTopProducts(), fetchCategoryRevenue()])
      .finally(() => setAdditionalLoading(false))
    
    return () => controller.abort()
  }, [queryParams])

  // Export handler
  const handleExport = useCallback(async (type: ExportType) => {
    try {
      const params = new URLSearchParams({
        type,
        format: 'xlsx',
        ...queryParams,
      })
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api"}/reports/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bao-cao-${type}-${new Date().toISOString().split("T")[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({ title: "Xuất báo cáo thành công" })
    } catch {
      toast({ title: "Lỗi xuất báo cáo", variant: "destructive" })
    }
  }, [queryParams, toast])

  // Loading state
  const isLoading = revenueLoading || orderLoading || additionalLoading

  // Error handling
  useEffect(() => {
    if (revenueError) {
      toast({ title: revenueError, variant: "destructive" })
    }
    if (orderError) {
      toast({ title: orderError, variant: "destructive" })
    }
  }, [revenueError, orderError, toast])

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Báo cáo thống kê</h1>
            <p className="text-muted-foreground">
              Phân tích doanh thu và đơn hàng
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <ExportButton onExport={handleExport} disabled={isLoading} />
          </div>
        </div>

        {/* Filters row */}
        <ReportFilters
          categories={categories}
          filters={filters}
          onChange={setFilters}
        />
      </div>

      {/* Report content - always render, show skeleton when loading */}
      <div>
        {/* Summary cards - has built-in skeleton */}
        <ReportSummaryCards
          summary={revenueData?.summary || null}
          isLoading={revenueLoading}
        />

        {/* Charts grid (2x2) */}
        <div className="grid gap-6 md:grid-cols-2 mt-6">
          <RevenueChart
            data={revenueData?.chart || []}
            groupBy={autoGroupBy}
          />
          <OrderStatusChart data={orderData?.orderStatus || []} />
          <CategoryRevenueChart data={categoryRevenue} />
          <PaymentMethodChart data={orderData?.paymentMethods || []} />
        </div>

        {/* Top products table */}
        <div className="mt-6">
          <TopProductsTable
            products={topProducts}
            isLoading={additionalLoading}
            limit={10}
          />
        </div>
      </div>
    </div>
  )
}
