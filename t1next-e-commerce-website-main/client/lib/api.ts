/**
 * API Client
 * Centralized API communication layer
 * - Handles authentication tokens
 * - Provides typed methods for all API endpoints
 * - Error handling with custom ApiError class
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/** Validation error từ Zod trên server */
export interface ValidationError {
  path: string[]
  message: string
}

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string | ValidationError[]
  message?: string
  retryAfter?: number
}

interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * Custom Error class cho API errors
 * Chứa thông tin chi tiết: validation errors, rate limit, status code
 */
export class ApiError extends Error {
  public validationErrors?: ValidationError[]
  public retryAfter?: number
  public statusCode: number

  constructor(
    message: string,
    statusCode: number,
    validationErrors?: ValidationError[],
    retryAfter?: number
  ) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.validationErrors = validationErrors
    this.retryAfter = retryAfter
  }
}

class ApiClient {
  private token: string | null = null

  setToken(token: string | null) {
    this.token = token
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('token', token)
      } else {
        localStorage.removeItem('token')
      }
    }
  }

  getToken(): string | null {
    if (this.token) return this.token
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('token')
    }
    return this.token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken()
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      // Handle authentication errors (401 Unauthorized)
      if (response.status === 401) {
        // Token is invalid or expired, clear it
        this.setToken(null)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('nhh-coffee-user')
          // Dispatch custom event to notify auth context
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        throw new ApiError(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          response.status
        )
      }
      // Handle validation errors (array of { path, message })
      if (Array.isArray(data.error)) {
        throw new ApiError(
          'Validation failed',
          response.status,
          data.error as ValidationError[]
        )
      }
      // Handle rate limit errors
      if (response.status === 429) {
        throw new ApiError(
          data.error || 'Too many requests',
          response.status,
          undefined,
          data.retryAfter
        )
      }
      // Handle other errors (string message)
      throw new ApiError(
        data.error || 'Something went wrong',
        response.status
      )
    }

    return data
  }

  // Auth
  async login(email: string, password: string) {
    const res = await this.request<ApiResponse<{ user: User; token: string }>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (res.data?.token) {
      this.setToken(res.data.token)
    }
    return res
  }

  async register(email: string, password: string, name: string) {
    // Register now returns message + email, not user/token (OTP flow)
    return this.request<ApiResponse<never> & { email?: string; message?: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    })
  }

  async verifyOTP(email: string, otp: string) {
    const res = await this.request<ApiResponse<{ user: User; token: string }>>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    })
    if (res.data?.token) {
      this.setToken(res.data.token)
    }
    return res
  }

  async resendOTP(email: string) {
    return this.request<ApiResponse<{ message: string }>>('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  }

  async getMe() {
    return this.request<ApiResponse<User>>('/auth/me')
  }

  async updateProfile(data: Partial<User>) {
    return this.request<ApiResponse<User>>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<ApiResponse<{ message: string }>>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    })
  }

  logout() {
    this.setToken(null)
  }

  // Upload
  async uploadFile(file: File) {
    const token = this.getToken()
    const formData = new FormData()
    formData.append('file', file)

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.error || 'Upload failed', response.status)
    }

    return data as ApiResponse<{ url: string; filename: string }>
  }

  // Products
  async getProducts(params?: {
    category?: string
    brand?: string
    search?: string
    featured?: boolean
    isNew?: boolean
    minPrice?: number
    maxPrice?: number
    sort?: string
    page?: number
    limit?: number
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`)
  }

  async getProduct(slug: string) {
    return this.request<ApiResponse<Product>>(`/products/${slug}`)
  }

  async getProductById(id: string) {
    return this.request<ApiResponse<Product>>(`/products/by-id/${id}`)
  }

  async getFeaturedProducts() {
    return this.request<ApiResponse<Product[]>>('/products/featured')
  }

  async getNewProducts() {
    return this.request<ApiResponse<Product[]>>('/products/new')
  }

  // Categories
  async getCategories() {
    return this.request<ApiResponse<Category[]>>('/categories')
  }

  async getCategory(slug: string) {
    return this.request<ApiResponse<Category>>(`/categories/${slug}`)
  }

  // Cart
  async getCart() {
    return this.request<ApiResponse<CartItem[]>>('/cart')
  }

  async addToCart(productId: string, quantity = 1) {
    return this.request<ApiResponse<CartItem>>('/cart', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    })
  }

  async updateCartItem(id: string, quantity: number) {
    return this.request<ApiResponse<CartItem>>(`/cart/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    })
  }

  async removeFromCart(id: string) {
    return this.request<ApiResponse<void>>(`/cart/${id}`, {
      method: 'DELETE',
    })
  }

  async clearCart() {
    return this.request<ApiResponse<void>>('/cart', {
      method: 'DELETE',
    })
  }

  // Checkout
  async getCheckout() {
    return this.request<ApiResponse<CheckoutInfo>>('/checkout')
  }

  async createCheckoutOrder(data: CreateCheckoutOrderData) {
    return this.request<ApiResponse<CreateCheckoutOrderResponse>>('/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Orders
  async getOrders() {
    return this.request<ApiResponse<Order[]>>('/orders')
  }

  async getOrder(id: string) {
    return this.request<ApiResponse<Order>>(`/orders/${id}`)
  }

  async createOrder(shippingAddress: string, paymentMethod: string) {
    return this.request<ApiResponse<Order>>('/orders', {
      method: 'POST',
      body: JSON.stringify({ shippingAddress, paymentMethod }),
    })
  }

  async cancelOrder(id: string) {
    return this.request<ApiResponse<void>>(`/orders/${id}/cancel`, {
      method: 'PUT',
    })
  }

  // Payment
  async getPaymentQR(orderId: string) {
    return this.request<ApiResponse<PaymentQRData>>(`/payment/qr/${orderId}`)
  }

  async getPaymentStatus(orderId: string) {
    return this.request<ApiResponse<PaymentStatusData>>(`/payment/status/${orderId}`)
  }

  // Wishlist
  async getWishlist() {
    return this.request<ApiResponse<WishlistItem[]>>('/wishlist')
  }

  async addToWishlist(productId: string) {
    return this.request<ApiResponse<{ id: string }>>('/wishlist', {
      method: 'POST',
      body: JSON.stringify({ productId }),
    })
  }

  async removeFromWishlist(productId: string) {
    return this.request<ApiResponse<void>>(`/wishlist/${productId}`, {
      method: 'DELETE',
    })
  }

  async checkWishlist(productId: string) {
    return this.request<ApiResponse<{ inWishlist: boolean }>>(`/wishlist/check/${productId}`)
  }

  // Reviews
  async getProductReviews(productId: string) {
    return this.request<ApiResponse<Review[]>>(`/reviews/product/${productId}`)
  }

  async createReview(productId: string, rating: number, comment: string, images?: File[]) {
    const token = this.getToken()
    const formData = new FormData()
    formData.append('productId', productId)
    formData.append('rating', rating.toString())
    formData.append('comment', comment)
    
    if (images && images.length > 0) {
      images.forEach(image => formData.append('images', image))
    }

    const headers: Record<string, string> = {}
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_URL}/reviews`, {
      method: 'POST',
      headers,
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new ApiError(data.error || 'Failed to create review', response.status)
    }

    return data as ApiResponse<Review>
  }

  async deleteReview(id: string) {
    return this.request<ApiResponse<void>>(`/reviews/${id}`, {
      method: 'DELETE',
    })
  }

  // Admin Stats
  async getAdminStats() {
    return this.request<ApiResponse<AdminStats>>('/admin/stats')
  }

  // Admin Products
  async getAdminProducts(params?: {
    page?: number
    limit?: number
    search?: string
    category?: string
    sort?: string
    order?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<Product>>(`/admin/products${query ? `?${query}` : ''}`)
  }

  async getAdminProduct(id: string) {
    return this.request<ApiResponse<Product>>(`/admin/products/${id}`)
  }

  async createAdminProduct(data: CreateProductData) {
    return this.request<ApiResponse<Product>>('/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAdminProduct(id: string, data: Partial<CreateProductData>) {
    return this.request<ApiResponse<Product>>(`/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAdminProduct(id: string) {
    return this.request<ApiResponse<void>>(`/admin/products/${id}`, {
      method: 'DELETE',
    })
  }

  // Admin Categories
  async getAdminCategories() {
    return this.request<ApiResponse<AdminCategory[]>>('/admin/categories')
  }

  async createAdminCategory(data: CreateCategoryData) {
    return this.request<ApiResponse<AdminCategory>>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateAdminCategory(id: string, data: Partial<CreateCategoryData>) {
    return this.request<ApiResponse<AdminCategory>>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteAdminCategory(id: string) {
    return this.request<ApiResponse<void>>(`/admin/categories/${id}`, {
      method: 'DELETE',
    })
  }

  // Admin Orders
  async getAdminOrders(params?: {
    page?: number
    limit?: number
    status?: string
    from?: string
    to?: string
    sort?: string
    order?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<AdminOrder>>(`/admin/orders${query ? `?${query}` : ''}`)
  }

  async getAdminOrder(id: string) {
    return this.request<ApiResponse<AdminOrderDetail>>(`/admin/orders/${id}`)
  }

  async updateAdminOrderStatus(id: string, status: string) {
    return this.request<ApiResponse<Order>>(`/admin/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
  }

  // Admin Users
  async getAdminUsers(params?: {
    page?: number
    limit?: number
    search?: string
    sort?: string
    order?: 'asc' | 'desc'
  }) {
    const searchParams = new URLSearchParams()
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          searchParams.append(key, String(value))
        }
      })
    }
    const query = searchParams.toString()
    return this.request<PaginatedResponse<AdminUser>>(`/admin/users${query ? `?${query}` : ''}`)
  }

  async getAdminUser(id: string) {
    return this.request<ApiResponse<AdminUserDetail>>(`/admin/users/${id}`)
  }

  async updateAdminUser(id: string, data: UpdateUserData) {
    return this.request<ApiResponse<User>>(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async updateAdminUserStatus(id: string, isActive: boolean) {
    return this.request<ApiResponse<User>>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    })
  }

  // Upload
  async uploadImage(file: File): Promise<ApiResponse<UploadedFile>> {
    const token = this.getToken()
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new ApiError(data.error || 'Upload failed', response.status)
    }
    return data
  }

  async uploadImages(files: File[]): Promise<ApiResponse<UploadedFile[]>> {
    const token = this.getToken()
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))

    const response = await fetch(`${API_URL}/upload/multiple`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    })

    const data = await response.json()
    if (!response.ok) {
      throw new ApiError(data.error || 'Upload failed', response.status)
    }
    return data
  }

  async deleteUploadedFile(filename: string) {
    return this.request<ApiResponse<{ message: string }>>(`/upload/${filename}`, {
      method: 'DELETE',
    })
  }

  // POS (Point of Sale)
  async createPOSOrder(data: {
    items: Array<{ productId: string; quantity: number; price: number }>
    customerName?: string
    customerPhone?: string
    customerId?: string
    paymentMethod: string
    shippingAddress?: string
    promotionId?: string
    discountAmount?: number
  }) {
    return this.request<ApiResponse<{
      id: string
      total: number
      status: string
      paymentMethod: string
      customerName: string
      customerPhone: string
      createdAt: string
    }>>('/pos/order', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getPOSOrders() {
    return this.request<ApiResponse<Array<{
      id: string
      total: number
      status: string
      customerName: string
      itemsCount: number
      createdAt: string
    }>>>('/pos/orders')
  }

  async getPOSStats() {
    return this.request<ApiResponse<{
      totalOrders: number
      totalRevenue: number
      totalItems: number
    }>>('/pos/stats')
  }

  async getPOSHistory(params?: { search?: string; from?: string; to?: string; payment?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.payment) query.set('payment', params.payment)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    return this.request<{
      success: boolean
      data: Array<{
        id: string; total: number; status: string; paymentMethod: string
        customerName: string; phone: string; discount: number
        itemsCount: number; staffEmail: string; createdAt: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/pos/history?${query}`)
  }

  async getPOSOrderDetail(id: string) {
    return this.request<ApiResponse<{
      id: string; total: number; subtotal: number; discount: number
      status: string; paymentMethod: string; customerName: string; phone: string
      createdAt: string; staffEmail: string
      promotion: { code: string; name: string } | null
      items: Array<{ id: string; productId: string; name: string; image: string | null; quantity: number; price: number }>
    }>>(`/pos/order/${id}`)
  }

  // Promotions
  async getPromotions(params?: { status?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.status) query.set('status', params.status)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    return this.request<ApiResponse<Array<{
      id: string; code: string; name: string; description: string | null
      type: 'percentage' | 'fixed'; value: number; min_order_value: number
      max_discount: number | null; usage_limit: number | null; used_count: number
      start_date: string | null; end_date: string | null; is_active: boolean; created_at: string
    }>>>(`/promotions?${query}`)
  }

  async validatePromotion(code: string, orderTotal: number) {
    return this.request<ApiResponse<{
      id: string; code: string; name: string; type: string
      value: number; discount: number; minOrderValue: number; maxDiscount: number | null
    }>>(`/promotions/validate/${code}?orderTotal=${orderTotal}`)
  }

  async createPromotion(data: {
    code: string; name: string; description?: string | null; type: 'percentage' | 'fixed'
    value: number; minOrderValue?: number; maxDiscount?: number | null
    usageLimit?: number | null; startDate?: string | null; endDate?: string | null
  }) {
    return this.request<ApiResponse<unknown>>('/promotions', { method: 'POST', body: JSON.stringify(data) })
  }

  async updatePromotion(id: string, data: Partial<{
    code: string; name: string; description: string | null; type: 'percentage' | 'fixed'
    value: number; minOrderValue: number; maxDiscount: number | null
    usageLimit: number | null; startDate: string | null; endDate: string | null; isActive: boolean
  }>) {
    return this.request<ApiResponse<unknown>>(`/promotions/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }

  async togglePromotion(id: string) {
    return this.request<ApiResponse<unknown>>(`/promotions/${id}/toggle`, { method: 'POST' })
  }

  async deletePromotion(id: string) {
    return this.request<ApiResponse<unknown>>(`/promotions/${id}`, { method: 'DELETE' })
  }

  // Reports
  async getRevenueReport(params?: { 
    from?: string
    to?: string
    groupBy?: 'day' | 'week' | 'month'
    categories?: string
    statuses?: string
    paymentMethods?: string
  }) {
    const query = new URLSearchParams()
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.groupBy) query.set('groupBy', params.groupBy)
    if (params?.categories) query.set('categories', params.categories)
    if (params?.statuses) query.set('statuses', params.statuses)
    if (params?.paymentMethods) query.set('paymentMethods', params.paymentMethods)
    return this.request<ApiResponse<{
      chart: Array<{ date: string; revenue: number; orders: number; items: number }>
      summary: {
        totalRevenue: number; totalOrders: number; totalItems: number
        avgOrderValue: number; revenueGrowth: number; prevRevenue: number
      }
      period: { from: string; to: string; groupBy: string }
    }>>(`/reports/revenue?${query}`)
  }

  async getTopProductsReport(params?: { 
    from?: string
    to?: string
    limit?: number
    categories?: string
    statuses?: string
    paymentMethods?: string
  }) {
    const query = new URLSearchParams()
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.limit) query.set('limit', params.limit.toString())
    if (params?.categories) query.set('categories', params.categories)
    if (params?.statuses) query.set('statuses', params.statuses)
    if (params?.paymentMethods) query.set('paymentMethods', params.paymentMethods)
    return this.request<ApiResponse<Array<{
      rank: number; productId: string; name: string; image: string | null
      totalQuantity: number; totalRevenue: number; orderCount: number
    }>>>(`/reports/top-products?${query}`)
  }

  async getTopCategoriesReport(params?: { 
    from?: string
    to?: string
    categories?: string
    statuses?: string
    paymentMethods?: string
  }) {
    const query = new URLSearchParams()
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.categories) query.set('categories', params.categories)
    if (params?.statuses) query.set('statuses', params.statuses)
    if (params?.paymentMethods) query.set('paymentMethods', params.paymentMethods)
    return this.request<ApiResponse<Array<{
      categoryId: string; name: string; totalQuantity: number
      totalRevenue: number; productCount: number; percentage: number
    }>>>(`/reports/top-categories?${query}`)
  }

  async getPaymentMethodsReport(params?: { 
    from?: string
    to?: string
    categories?: string
    statuses?: string
    paymentMethods?: string
  }) {
    const query = new URLSearchParams()
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.categories) query.set('categories', params.categories)
    if (params?.statuses) query.set('statuses', params.statuses)
    if (params?.paymentMethods) query.set('paymentMethods', params.paymentMethods)
    return this.request<ApiResponse<Array<{
      method: string; name: string; totalOrders: number; totalRevenue: number; percentage: number
    }>>>(`/reports/payment-methods?${query}`)
  }

  async getOrderStatusReport(params?: { 
    from?: string
    to?: string
    categories?: string
    statuses?: string
    paymentMethods?: string
  }) {
    const query = new URLSearchParams()
    if (params?.from) query.set('from', params.from)
    if (params?.to) query.set('to', params.to)
    if (params?.categories) query.set('categories', params.categories)
    if (params?.statuses) query.set('statuses', params.statuses)
    if (params?.paymentMethods) query.set('paymentMethods', params.paymentMethods)
    return this.request<ApiResponse<Array<{
      status: string; name: string; color: string; totalOrders: number; totalRevenue: number
    }>>>(`/reports/order-status?${query}`)
  }

  // Customers
  async getCustomers(params?: { search?: string; tier?: string; sort?: string; order?: string; page?: number; limit?: number }) {
    const query = new URLSearchParams()
    if (params?.search) query.set('search', params.search)
    if (params?.tier) query.set('tier', params.tier)
    if (params?.sort) query.set('sort', params.sort)
    if (params?.order) query.set('order', params.order)
    if (params?.page) query.set('page', params.page.toString())
    if (params?.limit) query.set('limit', params.limit.toString())
    return this.request<{
      success: boolean
      data: Array<{
        id: string; email: string; name: string; phone: string | null
        address: string | null; avatar: string | null; points: number
        tier: string; totalSpent: number; orderCount: number
        note: string | null; isActive: boolean; createdAt: string
      }>
      pagination: { page: number; limit: number; total: number; totalPages: number }
    }>(`/customers?${query}`)
  }

  async getCustomerStats() {
    return this.request<ApiResponse<{
      total: number
      byTier: { bronze: number; silver: number; gold: number; platinum: number }
      totalPoints: number
      newThisMonth: number
    }>>('/customers/stats')
  }

  async getCustomerDetail(id: string) {
    return this.request<ApiResponse<{
      id: string; email: string; name: string; phone: string | null
      address: string | null; avatar: string | null; points: number
      tier: string; totalSpent: number; orderCount: number
      note: string | null; isActive: boolean; createdAt: string
      recentOrders: Array<{ id: string; total: number; status: string; itemsCount: number; createdAt: string }>
    }>>(`/customers/${id}`)
  }

  async updateCustomer(id: string, data: { note?: string; pointsAdjust?: number }) {
    return this.request<ApiResponse<{ points: number; tier: string }>>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async recalculateCustomer(id: string) {
    return this.request<ApiResponse<{ totalSpent: number; orderCount: number; points: number; tier: string }>>(`/customers/${id}/recalculate`, { method: 'POST' })
  }

  async recalculateAllCustomers() {
    return this.request<ApiResponse<unknown>>('/customers/recalculate-all', { method: 'POST' })
  }
}

export const api = new ApiClient()

// Upload Types
export interface UploadedFile {
  url: string
  filename: string
  originalName: string
  size: number
  mimetype: string
}

// Wishlist Types
export interface WishlistItem {
  id: string
  product_id: string
  created_at: string
  product: {
    id: string
    name: string
    slug: string
    price: string
    original_price: string | null
    images: string[]
    brand: string | null
    stock: number
    rating: string
    discount: number
  }
}

// Admin Product Types
export interface CreateProductData {
  name: string
  description?: string
  price: number
  original_price?: number
  images?: string[]
  category_id: string
  brand?: string
  specs?: Record<string, string>
  stock?: number
  is_new?: boolean
  is_featured?: boolean
  discount?: number
}

// Admin Types
export interface AdminStats {
  revenue: {
    today: number
    week: number
    month: number
    total: number
  }
  orders: {
    pending: number
    confirmed: number
    shipping: number
    delivered: number
    cancelled: number
  }
  users: {
    total: number
    newThisMonth: number
  }
  products: {
    total: number
    lowStock: number
  }
  recentOrders: RecentOrder[]
  lowStockProducts: LowStockProduct[]
}

export interface RecentOrder {
  id: string
  total: number
  status: string
  created_at: string
  user_name: string | null
  user_email: string | null
}

export interface AdminOrder {
  id: string
  user_id: string
  total: number
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
  shipping_address: string
  payment_method: string
  created_at: string
  user_name: string | null
  user_email: string | null
  items_count: number
}

export interface AdminOrderDetail extends AdminOrder {
  user_phone: string | null
  items: Array<OrderItem & { slug?: string }>
}

export interface LowStockProduct {
  id: string
  name: string
  slug: string
  stock: number
  images: string[]
}

export interface AdminUser {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  address?: string
  role: 'user' | 'admin'
  isActive: boolean
  created_at: string
  orders_count: number
  total_spent: number
}

export interface AdminUserDetail extends Omit<AdminUser, 'orders_count'> {
  orders: Array<Order & { items_count: number }>
  total_spent: number
}

export interface UpdateUserData {
  name?: string
  phone?: string
  address?: string
  role?: 'user' | 'admin'
}

export interface AdminCategory {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  product_count?: number
}

export interface CreateCategoryData {
  name: string
  slug?: string
  icon?: string
  description?: string
}

// Types (re-export for convenience)
export interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  original_price?: number
  images: string[]
  category: Category
  brand: string
  specs: Record<string, string>
  stock: number
  rating: number
  review_count: number
  is_new?: boolean
  is_featured?: boolean
  discount?: number
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  product_count?: number
}

export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  phone?: string
  address?: string
  role?: "user" | "admin" | "sales" | "warehouse"
  is_active?: boolean
  created_at: string
  // Loyalty fields
  points?: number
  tier?: string
  totalSpent?: number
  orderCount?: number
}

export interface CartItem {
  id: string
  quantity: number
  product: Product
}

// Checkout Types
export interface CheckoutCartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    images: string[]
    stock: number
  }
}

export interface CheckoutInfo {
  items: CheckoutCartItem[]
  subtotal: number
  shippingFee: number
  shippingInfo?: {
    region: string
    freeShippingThreshold: number
    isFreeShipping: boolean
  }
  total: number
  user: {
    name: string
    phone: string | null
    address: string | null
  } | null
}

export interface CreateCheckoutOrderData {
  recipientName: string
  phone: string
  address: string
  note?: string
  paymentMethod: 'cod' | 'bank_transfer'
  idempotencyKey?: string
  promotionId?: string
  discountAmount?: number
}

export interface CreateCheckoutOrderResponse {
  orderId: string
  total: number
  status: 'pending'
  duplicate?: boolean
}

export interface Order {
  id: string
  total: number
  status: 'pending' | 'confirmed' | 'shipping' | 'delivered' | 'cancelled'
  shipping_address: string
  payment_method: string
  created_at: string
  items: OrderItem[]
}

export interface OrderItem {
  id: string
  product_id: string
  quantity: number
  price: number
  name: string
  images: string[]
}

export interface ReviewImage {
  id: string
  url: string
  public_id?: string | null
}

export interface Review {
  id: string
  user_id: string
  user_name: string
  user_avatar?: string
  product_id: string
  rating: number
  comment: string
  created_at: string
  images?: ReviewImage[]
}

// Payment Types
export interface PaymentQRData {
  qrUrl: string
  bankCode: string
  bankAccount: string
  accountName: string
  amount: number
  content: string
  orderId: string
}

export interface PaymentStatusData {
  orderId: string
  status: string
  isPaid: boolean
}


// Warehouse Types
export interface WarehouseProduct {
  id: string
  name: string
  slug: string
  images: string[]
  stock: number
  brand: string
  category_name: string
}

export interface InventorySummary {
  totalProducts: number
  totalStock: number
  lowStockCount: number
  outOfStockCount: number
  today: {
    import: { quantity: number; count: number }
    export: { quantity: number; count: number }
    adjust: { quantity: number; count: number }
  }
  week: {
    import: { quantity: number; count: number }
    export: { quantity: number; count: number }
    adjust: { quantity: number; count: number }
  }
}

export interface StockTransaction {
  id: string
  product_id: string
  user_id: string
  type: 'import' | 'export' | 'adjust' | 'order' | 'return'
  quantity: number
  reason?: string
  reference?: string
  stock_before: number
  stock_after: number
  created_at: string
  product_name?: string
  user_name?: string
}

// Extend ApiClient with warehouse methods
declare module './api' {
  interface ApiClient {
    getWarehouseStock(params?: { search?: string; lowStock?: boolean }): Promise<PaginatedResponse<WarehouseProduct>>
    getInventorySummary(): Promise<ApiResponse<InventorySummary>>
    importStock(data: { productId: string; quantity: number; reason?: string; reference?: string }): Promise<ApiResponse<StockTransaction> & { message?: string }>
    exportStock(data: { productId: string; quantity: number; reason?: string; reference?: string }): Promise<ApiResponse<StockTransaction> & { message?: string }>
    adjustStock(data: { productId: string; newStock: number; reason?: string }): Promise<ApiResponse<StockTransaction> & { message?: string }>
    getStockHistory(params?: { productId?: string; type?: string; from?: string; to?: string; page?: number; limit?: number }): Promise<PaginatedResponse<StockTransaction>>
    getLowStockProducts(threshold?: number): Promise<ApiResponse<WarehouseProduct[]>>
    getInventoryReport(): Promise<ApiResponse<CategoryReport[]>>
  }
}

export interface CategoryReport {
  category_id: string
  category_name: string
  product_count: number
  total_stock: number
  total_value: number
  low_stock_count: number
}

// Add warehouse methods to ApiClient prototype
ApiClient.prototype.getWarehouseStock = async function(params) {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.append('search', params.search)
  if (params?.lowStock) searchParams.append('lowStock', 'true')
  const query = searchParams.toString()
  return this['request'](`/warehouse/stock${query ? `?${query}` : ''}`)
}

ApiClient.prototype.getInventorySummary = async function() {
  return this['request']('/warehouse/inventory/summary')
}

ApiClient.prototype.importStock = async function(data) {
  return this['request']('/warehouse/stock/import', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

ApiClient.prototype.exportStock = async function(data) {
  return this['request']('/warehouse/stock/export', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

ApiClient.prototype.adjustStock = async function(data) {
  return this['request']('/warehouse/stock/adjust', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

ApiClient.prototype.getStockHistory = async function(params) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
  }
  const query = searchParams.toString()
  return this['request'](`/warehouse/stock/history${query ? `?${query}` : ''}`)
}

ApiClient.prototype.getLowStockProducts = async function(threshold = 10) {
  return this['request'](`/warehouse/inventory/low-stock?threshold=${threshold}`)
}

ApiClient.prototype.getInventoryReport = async function() {
  return this['request']('/warehouse/inventory/report')
}

// ============================================
// STAFF MANAGEMENT TYPES
// ============================================

/** Staff role types (excludes 'user') */
export type StaffRole = 'admin' | 'sales' | 'warehouse'

/** Staff member response from API */
export interface StaffMember {
  id: string
  email: string
  name: string
  role: StaffRole
  phone: string | null
  isActive: boolean
  createdAt: string
}

/** Query params for staff list */
export interface StaffListParams {
  page?: number
  limit?: number
  search?: string
  role?: StaffRole
  sort?: 'created_at' | 'name' | 'email'
  order?: 'asc' | 'desc'
}

/** Data for creating a new staff member */
export interface CreateStaffData {
  email: string
  password: string
  name: string
  role: StaffRole
  phone?: string
}

/** Data for updating a staff member */
export interface UpdateStaffData {
  name?: string
  role?: StaffRole
  phone?: string
}

// Extend ApiClient with staff management methods
declare module './api' {
  interface ApiClient {
    getStaffMembers(params?: StaffListParams): Promise<PaginatedResponse<StaffMember>>
    getStaffMember(id: string): Promise<ApiResponse<StaffMember>>
    createStaffMember(data: CreateStaffData): Promise<ApiResponse<StaffMember>>
    updateStaffMember(id: string, data: UpdateStaffData): Promise<ApiResponse<StaffMember>>
    resetStaffPassword(id: string, password: string): Promise<ApiResponse<StaffMember>>
    updateStaffStatus(id: string, isActive: boolean): Promise<ApiResponse<StaffMember>>
    deleteStaffMember(id: string): Promise<ApiResponse<void>>
  }
}

// Add staff management methods to ApiClient prototype
ApiClient.prototype.getStaffMembers = async function(params?: StaffListParams) {
  const searchParams = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value))
      }
    })
  }
  const query = searchParams.toString()
  return this['request'](`/admin/staff${query ? `?${query}` : ''}`)
}

ApiClient.prototype.getStaffMember = async function(id: string) {
  return this['request'](`/admin/staff/${id}`)
}

ApiClient.prototype.createStaffMember = async function(data: CreateStaffData) {
  return this['request']('/admin/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

ApiClient.prototype.updateStaffMember = async function(id: string, data: UpdateStaffData) {
  return this['request'](`/admin/staff/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

ApiClient.prototype.resetStaffPassword = async function(id: string, password: string) {
  return this['request'](`/admin/staff/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify({ password }),
  })
}

ApiClient.prototype.updateStaffStatus = async function(id: string, isActive: boolean) {
  return this['request'](`/admin/staff/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ isActive }),
  })
}

ApiClient.prototype.deleteStaffMember = async function(id: string) {
  return this['request'](`/admin/staff/${id}`, {
    method: 'DELETE',
  })
}


// ============================================
// SHIPPING TYPES & METHODS
// ============================================

export interface ShippingRate {
  region: string
  baseFee: number
  freeShippingThreshold: number
}

export interface ShippingCalculation {
  fee: number
  region: string
  freeShippingThreshold: number
  isFreeShipping: boolean
}

// Extend ApiClient with shipping methods
declare module './api' {
  interface ApiClient {
    getShippingRates(): Promise<ApiResponse<ShippingRate[]>>
    calculateShipping(address: string, orderTotal: number): Promise<ApiResponse<ShippingCalculation>>
  }
}

ApiClient.prototype.getShippingRates = async function() {
  return this['request']('/shipping/rates')
}

ApiClient.prototype.calculateShipping = async function(address: string, orderTotal: number) {
  return this['request']('/shipping/calculate', {
    method: 'POST',
    body: JSON.stringify({ address, orderTotal }),
  })
}
