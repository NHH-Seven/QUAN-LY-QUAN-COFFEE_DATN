export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price?: number
  images: string[]
  category_id: string
  brand: string
  specs: Record<string, string>
  stock: number
  rating: number
  review_count: number
  is_new?: boolean
  is_featured?: boolean
  discount?: number
  created_at: Date
}

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  product_count?: number
}

export type UserRole = 'user' | 'admin' | 'sales' | 'warehouse'

export type StockTransactionType = 'import' | 'export' | 'adjust' | 'order' | 'return'

export interface StockTransaction {
  id: string
  product_id: string
  user_id: string
  type: StockTransactionType
  quantity: number
  reason?: string
  reference?: string
  stock_before: number
  stock_after: number
  created_at: Date
}

export interface User {
  id: string
  email: string
  password: string
  name: string
  avatar?: string
  phone?: string
  address?: string
  role: UserRole
  isActive: boolean
  created_at: Date
}

export interface CartItem {
  id: string
  user_id: string
  product_id: string
  quantity: number
  created_at: Date
}

export interface Order {
  id: string
  user_id: string
  total: number
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
  shipping_address: string
  payment_method: string
  created_at: Date
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  quantity: number
  price: number
}

export interface Review {
  id: string
  user_id: string
  product_id: string
  rating: number
  comment: string
  created_at: Date
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// Auth types
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  name: string
}

export interface AuthResponse {
  user: Omit<User, 'password'>
  token: string
}

// JWT Payload
export interface JwtPayload {
  userId: string
  email: string
  role: UserRole
}
