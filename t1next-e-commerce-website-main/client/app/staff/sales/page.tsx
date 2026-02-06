"use client"

/**
 * Sales Page - Bán hàng tổng hợp
 * Gộp chức năng Tables (dùng tại quán) và POS (mang đi)
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UtensilsCrossed, ShoppingBag } from "lucide-react"

// Import components từ Tables và POS
import DineInTab from "./dine-in-tab"
import TakeawayTab from "./takeaway-tab"

export default function SalesPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuth()
  const [activeTab, setActiveTab] = useState<"dine-in" | "takeaway">("dine-in")

  // Check authentication
  if (!isLoading && !isAuthenticated) {
    router.push("/login")
    return null
  }

  // Check role
  if (user && !["admin", "sales", "warehouse"].includes(user.role)) {
    router.push("/")
    return null
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-3.5rem-5rem)] -m-4 md:-m-6 mb-0 flex flex-col">
      {/* Header */}
      <header className="border-b bg-card px-6 py-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Bán hàng</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý bán hàng tại quán và mang đi
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex-1 overflow-hidden min-h-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "dine-in" | "takeaway")} className="h-full flex flex-col">
          <div className="border-b bg-card px-6 shrink-0">
            <TabsList className="h-12">
              <TabsTrigger value="dine-in" className="gap-2">
                <UtensilsCrossed className="h-4 w-4" />
                Dùng tại quán
              </TabsTrigger>
              <TabsTrigger value="takeaway" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Mang đi
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dine-in" className="flex-1 m-0 overflow-hidden min-h-0">
            <DineInTab />
          </TabsContent>

          <TabsContent value="takeaway" className="flex-1 m-0 overflow-hidden min-h-0">
            <TakeawayTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
