/**
 * Types
 * Định nghĩa tất cả types chung cho ứng dụng
 */

// ============================================
// PRODUCT TYPES
// ============================================

/** Thông tin sản phẩm */
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  /** Giá bán hiện tại */
  price: number
  /** Giá gốc (trước giảm giá) */
  originalPrice?: number
  original_price?: number
  /** Danh sách URL hình ảnh */
  images: string[]
  category: Category
  category_id?: string
  brand: string
  /** Thông số kỹ thuật */
  specs: Record<string, string>
  /** Số lượng tồn kho */
  stock: number
  /** Điểm đánh giá trung bình (1-5) */
  rating: number
  /** Số lượng đánh giá */
  reviewCount?: number
  review_count?: number
  /** Sản phẩm mới */
  isNew?: boolean
  is_new?: boolean
  /** Sản phẩm nổi bật */
  isFeatured?: boolean
  is_featured?: boolean
  /** Phần trăm giảm giá */
  discount?: number
  createdAt?: string
  created_at?: string
}

/** Danh mục sản phẩm */
export interface Category {
  id: string
  name: string
  slug: string
  /** Icon name (mapping với Lucide icons) */
  icon?: string
  description?: string
  /** Số lượng sản phẩm trong danh mục */
  productCount?: number
}

// ============================================
// USER TYPES
// ============================================

/** Role của người dùng */
export type UserRole = "user" | "admin" | "sales" | "warehouse"

/** Thông tin người dùng */
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  address?: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

// ============================================
// CART TYPES
// ============================================

/** Item trong giỏ hàng */
export interface CartItem {
  product: Product
  quantity: number
}

// ============================================
// ORDER TYPES
// ============================================

/** Trạng thái đơn hàng */
export type OrderStatus = "pending" | "confirmed" | "shipping" | "delivered" | "cancelled"

/** Thông tin đơn hàng */
export interface Order {
  id: string
  userId: string
  items: CartItem[]
  /** Tổng giá trị đơn hàng */
  total: number
  status: OrderStatus
  shippingAddress: string
  paymentMethod: string
  createdAt: string
}

// ============================================
// REVIEW TYPES
// ============================================

/** Đánh giá sản phẩm */
export interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  productId: string
  /** Điểm đánh giá (1-5) */
  rating: number
  comment: string
  createdAt: string
}
