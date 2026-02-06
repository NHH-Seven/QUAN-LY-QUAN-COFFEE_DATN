/**
 * Chatbot Service
 * Business logic cho AI chatbot
 */

import { query, queryOne } from '../db/index.js'
import { geminiService } from './gemini.service.js'

interface ChatSession {
  id: string
  user_id: number | null
  guest_id: string | null
  status: string
  started_at: Date
  ended_at: Date | null
}

interface ChatMessage {
  id: string
  session_id: string
  sender_type: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown>
  created_at: Date
}

class ChatbotService {
  /**
   * Tạo hoặc lấy chat session
   */
  async getOrCreateSession(userId?: number, guestId?: string): Promise<ChatSession> {
    // Tìm session active
    let session: ChatSession | null = null

    if (userId) {
      session = await queryOne<ChatSession>(
        `SELECT * FROM chat_sessions 
         WHERE user_id = $1::text AND status = 'active' 
         ORDER BY created_at DESC LIMIT 1`,
        [userId.toString()]
      )
    }

    // Tạo session mới nếu chưa có
    if (!session) {
      // Nếu có userId, dùng userId. Nếu không, set NULL (guest)
      const sessionUserId = userId ? userId.toString() : null
      
      session = await queryOne<ChatSession>(
        `INSERT INTO chat_sessions (id, user_id, staff_id, status)
         VALUES (gen_random_uuid()::text, $1, NULL, 'active')
         RETURNING *`,
        [sessionUserId]
      )
    }

    return session!
  }

  /**
   * Lưu message vào database
   */
  async saveMessage(
    sessionId: string,
    role: 'user' | 'assistant' | 'system',
    content: string,
    metadata: Record<string, unknown> = {}
  ): Promise<ChatMessage> {
    const message = await queryOne<ChatMessage>(
      `INSERT INTO chat_messages (id, session_id, sender_id, sender_type, content, metadata)
       VALUES (gen_random_uuid()::text, $1, NULL, $2, $3, $4)
       RETURNING *`,
      [sessionId, role, content, JSON.stringify(metadata)]
    )
    return message!
  }

  /**
   * Lấy lịch sử chat
   */
  async getChatHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    const messages = await query<ChatMessage>(
      `SELECT * FROM chat_messages
       WHERE session_id = $1
       ORDER BY created_at ASC
       LIMIT $2`,
      [sessionId, limit]
    )
    return messages
  }

  /**
   * Tìm kiếm trong knowledge base
   */
  async searchKnowledge(query: string): Promise<{ title: string; content: string } | null> {
    try {
      // Tìm kiếm trong knowledge base
      const knowledge = await queryOne<{ title: string; content: string }>(
        `SELECT title, content FROM chatbot_knowledge 
         WHERE is_active = true 
           AND (
             title ILIKE $1 
             OR content ILIKE $1 
             OR $2 = ANY(tags)
           )
         ORDER BY 
           CASE 
             WHEN title ILIKE $1 THEN 1
             WHEN content ILIKE $1 THEN 2
             ELSE 3
           END
         LIMIT 1`,
        [`%${query}%`, query]
      )

      return knowledge
    } catch (error) {
      console.error('Search knowledge error:', error)
      return null
    }
  }

  /**
   * Xử lý tin nhắn từ user
   */
  async handleMessage(
    message: string,
    userId?: number,
    guestId?: string,
    userName?: string
  ): Promise<{ response: string; sessionId: string }> {
    try {
      // Lấy hoặc tạo session
      const session = await this.getOrCreateSession(userId, guestId)

      // Lưu message của user
      await this.saveMessage(session.id, 'user', message)

      // 1. Tìm trong knowledge base trước
      const knowledge = await this.searchKnowledge(message)
      
      if (knowledge) {
        console.log('Found answer in knowledge base:', knowledge.title)
        
        // Lưu response từ knowledge base
        await this.saveMessage(session.id, 'assistant', knowledge.content, {
          source: 'knowledge_base',
          title: knowledge.title
        })

        return {
          response: knowledge.content,
          sessionId: session.id
        }
      }

      // 2. Nếu không tìm thấy trong knowledge base, dùng AI
      console.log('No knowledge found, using AI...')

      // Lấy lịch sử chat để có context
      const history = await this.getChatHistory(session.id, 10)
      const previousMessages = history
        .filter(msg => msg.sender_type && msg.content !== message)
        .map(msg => ({
          role: msg.sender_type as 'user' | 'assistant',
          content: msg.content,
        }))

      console.log('Previous messages for context:', previousMessages.length)

      // Detect intent để xử lý đặc biệt
      const intent = await geminiService.detectIntent(message)
      console.log('Detected intent:', intent)

      // Extract keywords
      const keywords = this.extractKeywords(message)
      console.log('Extracted keywords:', keywords)

      let aiResponse: string

      // Xử lý theo intent với priority cao
      if (message.match(/khuyến mãi|giảm giá|sale|ưu đãi/i)) {
        aiResponse = await this.handleProductInquiry(message, session.id, previousMessages)
      } else if (intent.intent === 'product_inquiry' || keywords.some(k => 
        ['cà phê', 'coffee', 'trà', 'tea', 'đá xay', 'sinh tố', 'bánh', 'snack'].includes(k)
      )) {
        aiResponse = await this.handleProductInquiry(message, session.id, previousMessages)
      } else if (intent.intent === 'order_tracking') {
        aiResponse = await this.handleOrderTracking(message, userId, session.id, previousMessages)
      } else if (intent.intent === 'purchase_intent') {
        aiResponse = await this.handlePurchaseIntent(message, session.id, previousMessages)
      } else {
        // General chat
        aiResponse = await geminiService.chat(message, {
          sessionId: session.id,
          userId,
          userName,
          previousMessages,
        })
      }

      // Lưu response của AI
      await this.saveMessage(session.id, 'assistant', aiResponse, {
        intent: intent.intent,
        confidence: intent.confidence,
      })

      return {
        response: aiResponse,
        sessionId: session.id,
      }
    } catch (error) {
      console.error('Handle message error:', error)
      throw error
    }
  }

  /**
   * Xử lý câu hỏi về sản phẩm
   */
  private async handleProductInquiry(
    message: string,
    sessionId: string,
    previousMessages: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      // Kiểm tra xem có hỏi về khuyến mãi không
      if (message.match(/khuyến mãi|giảm giá|sale|ưu đãi|promotion/i)) {
        const promoProducts = await this.getPromotionalProducts()
        
        if (promoProducts.length > 0) {
          const productsInfo = promoProducts
            .map(p => `- ${p.name}: ${p.price.toLocaleString()}đ (Giảm ${p.discount}% từ ${p.original_price.toLocaleString()}đ)`)
            .join('\n')
          
          return geminiService.chat(
            `${message}\n\n[Sản phẩm đang khuyến mãi:\n${productsInfo}]\n\nHãy giới thiệu các sản phẩm này một cách hấp dẫn và khuyến khích khách hàng mua.`,
            { sessionId, previousMessages }
          )
        }
      }

      // Tìm sản phẩm liên quan
      const keywords = this.extractKeywords(message)
      console.log('Extracted keywords:', keywords)
      
      const products = await this.searchProducts(keywords)
      console.log('Found products:', products.length)

      // Nếu tìm thấy sản phẩm, thêm vào context
      if (products.length > 0) {
        const productsInfo = products
          .map(p => `- ${p.name}: ${p.price.toLocaleString()}đ - ${p.description || 'Sản phẩm chất lượng'} - Còn ${p.stock} sản phẩm`)
          .join('\n')
        
        return geminiService.chatWithContext(message, {
          sessionId,
          previousMessages,
          products: products.map(p => ({
            name: p.name,
            price: p.price,
            description: p.description || 'Sản phẩm chất lượng cao'
          }))
        })
      }

      // Không tìm thấy sản phẩm cụ thể
      return geminiService.chat(
        `${message}\n\n[Lưu ý: Không tìm thấy sản phẩm cụ thể. Hãy hỏi khách về nhu cầu chi tiết hơn hoặc đề xuất xem trên website.]`,
        { sessionId, previousMessages }
      )
    } catch (error) {
      console.error('Product inquiry error:', error)
      return geminiService.chat(message, { sessionId, previousMessages })
    }
  }

  /**
   * Xử lý tra cứu đơn hàng
   */
  private async handleOrderTracking(
    message: string,
    userId: number | undefined,
    sessionId: string,
    previousMessages: Array<{ role: string; content: string }>
  ): Promise<string> {
    try {
      // Extract order ID từ message
      const orderIdMatch = message.match(/#?(\d+)/)
      
      if (orderIdMatch) {
        const orderId = orderIdMatch[1]
        const order = await this.getOrderInfo(parseInt(orderId), userId)

        if (order) {
          return geminiService.chatWithContext(message, {
            sessionId,
            previousMessages,
            orderInfo: order,
          })
        }
      }

      // Không tìm thấy order ID hoặc order không tồn tại
      return geminiService.chat(
        message + '\n\n[Lưu ý: Không tìm thấy thông tin đơn hàng. Hãy hỏi khách mã đơn hàng.]',
        { sessionId, previousMessages }
      )
    } catch (error) {
      console.error('Order tracking error:', error)
      return geminiService.chat(message, { sessionId, previousMessages })
    }
  }

  /**
   * Xử lý ý định mua hàng
   */
  private async handlePurchaseIntent(
    message: string,
    sessionId: string,
    previousMessages: Array<{ role: string; content: string }>
  ): Promise<string> {
    // Hướng dẫn khách hàng đặt hàng
    return geminiService.chat(
      message + '\n\n[Hướng dẫn: Giúp khách đặt hàng qua website hoặc đến cửa hàng]',
      { sessionId, previousMessages }
    )
  }

  /**
   * Tìm kiếm sản phẩm
   */
  private async searchProducts(keywords: string[]): Promise<Array<{
    id: number
    name: string
    price: number
    description: string
    category: string
    stock: number
    image_url: string
  }>> {
    if (keywords.length === 0) return []

    try {
      // Tạo placeholders cho SQL
      const searchConditions = keywords.map((_, i) => 
        `(name ILIKE $${i * 2 + 1} OR description ILIKE $${i * 2 + 2})`
      ).join(' OR ')
      
      const params = keywords.flatMap(k => [`%${k}%`, `%${k}%`])
      
      const products = await query<{ 
        id: string
        name: string
        price: number
        description: string
        brand: string
        stock: number
        images: string[]
      }>(
        `SELECT id, name, price, description, brand, stock, images
         FROM products 
         WHERE stock > 0
         AND (${searchConditions})
         ORDER BY 
           CASE 
             WHEN ${keywords.map((_, i) => `name ILIKE $${i * 2 + 1}`).join(' OR ')} THEN 1
             ELSE 2
           END,
           price ASC
         LIMIT 10`,
        params
      )
      
      return products.map(p => ({
        id: parseInt(p.id),
        name: p.name,
        price: p.price,
        description: p.description || '',
        category: p.brand || '',
        stock: p.stock,
        image_url: p.images && p.images.length > 0 ? p.images[0] : ''
      }))
    } catch (error) {
      console.error('Search products error:', error)
      return []
    }
  }

  /**
   * Lấy thông tin đơn hàng
   */
  private async getOrderInfo(
    orderId: number,
    userId?: number
  ): Promise<{ id: string; status: string; total: number } | null> {
    try {
      const order = await queryOne<{ id: string; status: string; total: number }>(
        `SELECT id, status, total 
         FROM orders 
         WHERE id = $1 ${userId ? 'AND user_id = $2' : ''}`,
        userId ? [orderId, userId] : [orderId]
      )

      if (!order) return null

      return {
        id: order.id,
        status: order.status,
        total: order.total,
      }
    } catch (error) {
      console.error('Get order info error:', error)
      return null
    }
  }

  /**
   * Extract keywords từ message
   */
  private extractKeywords(message: string): string[] {
    // Remove stop words và lấy keywords
    const stopWords = ['tôi', 'muốn', 'cần', 'có', 'là', 'của', 'và', 'cho', 'về', 'với', 'được', 'này', 'đó', 'thì', 'sao', 'gì', 'nào', 'bao', 'nhiêu']
    const words = message
      .toLowerCase()
      .replace(/[^\w\sàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.includes(w))
    
    // Thêm các từ khóa phổ biến cho quán coffee
    const productKeywords = [
      'cà phê', 'coffee', 'espresso', 'americano', 'cappuccino', 'latte', 'mocha', 'macchiato',
      'trà', 'tea', 'đào', 'vải', 'sen', 'oolong', 'matcha',
      'đá xay', 'chocolate', 'cookies', 'cream', 'dâu', 'caramel',
      'nước ép', 'sinh tố', 'cam', 'dưa hấu', 'bơ', 'xoài',
      'bánh', 'tiramisu', 'cheesecake', 'croissant', 'mousse',
      'snack', 'khoai tây', 'gà viên', 'sandwich',
      'combo', 'hạt', 'arabica', 'robusta', 'blend'
    ]
    const foundKeywords = productKeywords.filter(k => message.toLowerCase().includes(k))
    
    return [...new Set([...words, ...foundKeywords])]
  }

  /**
   * Lấy sản phẩm khuyến mãi
   */
  private async getPromotionalProducts(): Promise<Array<{
    id: string
    name: string
    price: number
    original_price: number
    discount: number
    description: string
  }>> {
    try {
      const products = await query<{
        id: string
        name: string
        price: number
        original_price: number
        description: string
      }>(
        `SELECT id, name, price, 
                COALESCE(original_price, price * 1.2) as original_price,
                description
         FROM products 
         WHERE stock > 0 
         AND original_price IS NOT NULL 
         AND original_price > price
         ORDER BY (original_price - price) DESC
         LIMIT 5`
      )
      
      return products.map(p => ({
        ...p,
        discount: Math.round(((p.original_price - p.price) / p.original_price) * 100)
      }))
    } catch (error) {
      console.error('Get promotional products error:', error)
      return []
    }
  }

  /**
   * Lấy sản phẩm theo category
   */
  private async getProductsByCategory(category: string): Promise<Array<{
    id: string
    name: string
    price: number
    description: string
  }>> {
    try {
      const products = await query<{
        id: string
        name: string
        price: number
        description: string
      }>(
        `SELECT id, name, price, description
         FROM products 
         WHERE stock > 0 
         AND brand ILIKE $1
         ORDER BY price ASC
         LIMIT 10`,
        [`%${category}%`]
      )
      return products
    } catch (error) {
      console.error('Get products by category error:', error)
      return []
    }
  }

  /**
   * Đóng chat session
   */
  async closeSession(sessionId: string): Promise<void> {
    await queryOne(
      `UPDATE chat_sessions 
       SET status = 'closed', closed_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [sessionId]
    )
    
    // Clear Gemini session
    geminiService.clearSession(sessionId)
  }

  /**
   * Lưu feedback
   */
  async saveFeedback(
    sessionId: string,
    messageId: string,
    rating: number,
    feedback?: string
  ): Promise<void> {
    await queryOne(
      `INSERT INTO chatbot_feedback (session_id, message_id, rating, feedback)
       VALUES ($1, $2, $3, $4)`,
      [sessionId, messageId, rating, feedback || null]
    )
  }

  /**
   * Lấy analytics
   */
  async getAnalytics(startDate: Date, endDate: Date): Promise<{
    totalSessions: number
    totalMessages: number
    avgMessagesPerSession: number
    avgRating: number
  }> {
    const stats = await queryOne<{
      total_sessions: string
      total_messages: string
      avg_messages: string
      avg_rating: string
    }>(
      `SELECT 
        COUNT(DISTINCT cs.id) as total_sessions,
        COUNT(cm.id) as total_messages,
        AVG(msg_count.count) as avg_messages,
        AVG(cf.rating) as avg_rating
       FROM chat_sessions cs
       LEFT JOIN chat_messages cm ON cs.id = cm.session_id
       LEFT JOIN chatbot_feedback cf ON cs.id = cf.session_id
       LEFT JOIN (
         SELECT session_id, COUNT(*) as count 
         FROM chat_messages 
         GROUP BY session_id
       ) msg_count ON cs.id = msg_count.session_id
       WHERE cs.created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    )

    return {
      totalSessions: parseInt(stats?.total_sessions || '0'),
      totalMessages: parseInt(stats?.total_messages || '0'),
      avgMessagesPerSession: parseFloat(stats?.avg_messages || '0'),
      avgRating: parseFloat(stats?.avg_rating || '0'),
    }
  }
}

export const chatbotService = new ChatbotService()
