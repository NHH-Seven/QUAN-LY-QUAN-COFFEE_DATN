"use client"

/**
 * LoyaltyCard Component
 * Hiển thị thông tin điểm thưởng và hạng thành viên
 */

import { useState } from "react"
import { Crown, Star, Award, Gift, TrendingUp, History, ChevronDown } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { PointsHistory } from "./points-history"
import { cn } from "@/lib/utils"

interface LoyaltyCardProps {
  points: number
  tier: string
  totalSpent: number
  orderCount: number
}

const TIER_CONFIG = {
  bronze: {
    name: "Bronze",
    color: "from-amber-600 to-amber-800",
    textColor: "text-amber-100",
    icon: Award,
    minPoints: 0,
    nextTier: "Silver",
    nextPoints: 500,
    discount: 0,
  },
  silver: {
    name: "Silver", 
    color: "from-gray-400 to-gray-600",
    textColor: "text-gray-100",
    icon: Star,
    minPoints: 500,
    nextTier: "Gold",
    nextPoints: 2000,
    discount: 3,
  },
  gold: {
    name: "Gold",
    color: "from-yellow-500 to-yellow-700",
    textColor: "text-yellow-100",
    icon: Crown,
    minPoints: 2000,
    nextTier: "Platinum",
    nextPoints: 5000,
    discount: 5,
  },
  platinum: {
    name: "Platinum",
    color: "from-purple-500 to-purple-800",
    textColor: "text-purple-100",
    icon: Gift,
    minPoints: 5000,
    nextTier: null,
    nextPoints: null,
    discount: 10,
  },
}

export function LoyaltyCard({ points, tier, totalSpent, orderCount }: LoyaltyCardProps) {
  const [showHistory, setShowHistory] = useState(false)
  const config = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] || TIER_CONFIG.bronze
  const TierIcon = config.icon

  // Calculate progress to next tier
  const progress = config.nextPoints 
    ? Math.min(100, ((points - config.minPoints) / (config.nextPoints - config.minPoints)) * 100)
    : 100
  const pointsToNext = config.nextPoints ? config.nextPoints - points : 0

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('vi-VN').format(num)
  }

  const formatPrice = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)
  }

  return (
    <Card className="overflow-hidden">
      {/* Tier Banner */}
      <div className={cn("bg-gradient-to-r p-6", config.color)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <TierIcon className={cn("h-6 w-6", config.textColor)} />
            </div>
            <div>
              <p className={cn("text-sm opacity-80", config.textColor)}>Hạng thành viên</p>
              <h3 className={cn("text-2xl font-bold", config.textColor)}>{config.name}</h3>
            </div>
          </div>
          <div className="text-right">
            <p className={cn("text-sm opacity-80", config.textColor)}>Điểm tích lũy</p>
            <p className={cn("text-3xl font-bold", config.textColor)}>{formatNumber(points)}</p>
          </div>
        </div>

        {/* Progress to next tier */}
        {config.nextTier && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className={cn("opacity-80", config.textColor)}>{config.name}</span>
              <span className={cn("opacity-80", config.textColor)}>{config.nextTier}</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
            <p className={cn("text-xs mt-1 opacity-80", config.textColor)}>
              Còn {formatNumber(pointsToNext)} điểm để lên hạng {config.nextTier}
            </p>
          </div>
        )}

        {!config.nextTier && (
          <p className={cn("text-sm mt-4 opacity-80", config.textColor)}>
            🎉 Bạn đã đạt hạng cao nhất!
          </p>
        )}
      </div>

      {/* Stats */}
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-primary">{orderCount}</p>
            <p className="text-xs text-muted-foreground">Đơn hàng</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{config.discount}%</p>
            <p className="text-xs text-muted-foreground">Giảm giá</p>
          </div>
          <div>
            <p className="text-lg font-bold text-primary">{formatPrice(totalSpent).replace('₫', '')}</p>
            <p className="text-xs text-muted-foreground">Đã chi tiêu</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm font-medium mb-2">Quyền lợi của bạn:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Tích điểm 1% giá trị đơn hàng
            </li>
            {config.discount > 0 && (
              <li className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" />
                Giảm {config.discount}% tất cả đơn hàng
              </li>
            )}
            {tier === 'gold' || tier === 'platinum' ? (
              <li className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                Ưu tiên hỗ trợ khách hàng
              </li>
            ) : null}
            {tier === 'platinum' && (
              <li className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                Quà tặng sinh nhật đặc biệt
              </li>
            )}
          </ul>
        </div>

        {/* Points History */}
        <Collapsible open={showHistory} onOpenChange={setShowHistory} className="mt-4 pt-4 border-t">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <History className="h-4 w-4" />
                Lịch sử điểm thưởng
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showHistory && "rotate-180")} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-3">
            <PointsHistory />
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
