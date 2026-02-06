"use client"

import { useState, useEffect } from "react"
import { Star, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { api, ApiError, type Review } from "@/lib/api"
import { ImageUploader } from "./image-uploader"
import { ReviewImageGallery } from "./review-image-gallery"

interface ProductReviewsProps {
  productId: string
  initialRating?: number
  initialReviewCount?: number
}

export function ProductReviews({ productId, initialRating = 0, initialReviewCount = 0 }: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuth()
  const { toast } = useToast()
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  
  // Form state
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [images, setImages] = useState<File[]>([])

  // Fetch reviews
  useEffect(() => {
    async function fetchReviews() {
      try {
        setIsLoading(true)
        const response = await api.getProductReviews(productId)
        if (response.success && response.data) {
          setReviews(response.data)
        }
      } catch (err) {
        console.error("Failed to fetch reviews:", err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchReviews()
  }, [productId])

  // Calculate rating stats
  const ratingStats = {
    5: 0, 4: 0, 3: 0, 2: 0, 1: 0
  }
  reviews.forEach(r => {
    if (r.rating >= 1 && r.rating <= 5) {
      ratingStats[r.rating as keyof typeof ratingStats]++
    }
  })
  const totalReviews = reviews.length
  const avgRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
    : Number(initialRating) || 0

  // Check if user already reviewed
  const userReview = reviews.find(r => r.user_id === user?.id)

  const resetForm = () => {
    setRating(0)
    setComment("")
    setImages([])
    setShowForm(false)
  }

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast({ title: "Vui lòng đăng nhập để đánh giá", variant: "destructive" })
      return
    }
    if (rating === 0) {
      toast({ title: "Vui lòng chọn số sao", variant: "destructive" })
      return
    }

    try {
      setSubmitting(true)
      const response = await api.createReview(productId, rating, comment, images.length > 0 ? images : undefined)
      if (response.success && response.data) {
        // Add new review to list
        const newReview: Review = {
          ...response.data,
          user_name: user?.name || "Ẩn danh",
          user_avatar: user?.avatar
        }
        setReviews(prev => [newReview, ...prev])
        resetForm()
        toast({ title: "Đã gửi đánh giá!" })
      }
    } catch (err) {
      if (err instanceof ApiError) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async (reviewId: string) => {
    try {
      await api.deleteReview(reviewId)
      setReviews(prev => prev.filter(r => r.id !== reviewId))
      toast({ title: "Đã xóa đánh giá" })
    } catch (err) {
      if (err instanceof ApiError) {
        toast({ title: "Lỗi", description: err.message, variant: "destructive" })
      }
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-lg font-semibold mb-6">Đánh giá sản phẩm</h2>

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Rating summary */}
        <div className="rounded-xl bg-muted/50 p-6">
          <div className="text-center">
            <span className="text-5xl font-bold">{avgRating.toFixed(1)}</span>
            <div className="mt-2 flex justify-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"}`} 
                />
              ))}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Dựa trên {totalReviews || initialReviewCount} đánh giá
            </p>
          </div>

          <div className="mt-6 space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingStats[star as keyof typeof ratingStats]
              const percent = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="w-3 text-sm">{star}</span>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <Progress value={percent} className="flex-1 h-2" />
                  <span className="w-8 text-right text-sm text-muted-foreground">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>

          {!userReview && (
            <Button 
              className="mt-6 w-full" 
              onClick={() => setShowForm(!showForm)}
              disabled={!isAuthenticated}
            >
              {isAuthenticated ? "Viết đánh giá" : "Đăng nhập để đánh giá"}
            </Button>
          )}
        </div>

        {/* Reviews list */}
        <div className="space-y-6">
          {/* Review form */}
          {showForm && (
            <div className="rounded-xl border border-border p-6">
              <h3 className="font-semibold">Viết đánh giá của bạn</h3>
              <div className="mt-4 flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={submitting}
                  >
                    <Star 
                      className={`h-7 w-7 transition-colors ${
                        star <= (hoverRating || rating) 
                          ? "fill-yellow-400 text-yellow-400" 
                          : "text-muted-foreground hover:text-yellow-400"
                      }`} 
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground self-center">
                    {rating === 5 ? "Tuyệt vời" : rating === 4 ? "Tốt" : rating === 3 ? "Bình thường" : rating === 2 ? "Tệ" : "Rất tệ"}
                  </span>
                )}
              </div>
              <Textarea 
                placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm..." 
                className="mt-4" 
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={submitting}
              />
              
              {/* Image uploader */}
              <div className="mt-4">
                <label className="text-sm font-medium mb-2 block">Thêm hình ảnh (tùy chọn)</label>
                <ImageUploader
                  images={images}
                  onImagesChange={setImages}
                  disabled={submitting}
                />
              </div>

              <div className="mt-4 flex gap-2">
                <Button onClick={handleSubmitReview} disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gửi đánh giá
                </Button>
                <Button variant="outline" onClick={resetForm} disabled={submitting}>
                  Hủy
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="border-b border-border pb-6 last:border-0">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.user_avatar || "/placeholder.svg"} alt={review.user_name} />
                    <AvatarFallback>{review.user_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{review.user_name}</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      {review.user_id === user?.id && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDeleteReview(review.id)}
                        >
                          Xóa
                        </Button>
                      )}
                    </div>
                    <div className="mt-1 flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "fill-yellow-400 text-yellow-400" : "fill-muted text-muted"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="mt-3 text-muted-foreground">{review.comment}</p>
                    )}
                    
                    {/* Review images */}
                    {review.images && review.images.length > 0 && (
                      <div className="mt-3">
                        <ReviewImageGallery images={review.images} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Chưa có đánh giá nào. Hãy là người đầu tiên đánh giá sản phẩm này!
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
