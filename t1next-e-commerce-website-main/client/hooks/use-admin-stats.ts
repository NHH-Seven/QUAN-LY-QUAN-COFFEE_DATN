"use client"

import { useState, useEffect } from "react"
import { api, AdminStats } from "@/lib/api"

interface UseAdminStatsReturn {
  stats: AdminStats | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook để fetch admin stats từ API
 */
export function useAdminStats(): UseAdminStatsReturn {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await api.getAdminStats()
      if (response.data) {
        setStats(response.data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể tải dữ liệu")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  return { stats, isLoading, error, refetch: fetchStats }
}
