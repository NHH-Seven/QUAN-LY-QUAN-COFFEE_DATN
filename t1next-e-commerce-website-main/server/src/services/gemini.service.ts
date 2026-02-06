/**
 * Google Gemini AI Service
 * Handles AI chat interactions using Google Gemini API
 */

import { GoogleGenerativeAI, GenerativeModel, ChatSession } from '@google/generative-ai'

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''

if (!GEMINI_API_KEY) {
  console.warn('⚠️  GEMINI_API_KEY not found in environment variables')
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)

// System prompt với context về cửa hàng
const SYSTEM_PROMPT = `Bạn là trợ lý AI thông minh của NHH Coffee - quán cà phê chuyên nghiệp.

NHIỆM VỤ CỦA BẠN:
- Tư vấn đồ uống và món ăn cho khách hàng một cách nhiệt tình và chuyên nghiệp
- Trả lời câu hỏi về menu, giá cả, chính sách quán
- Hỗ trợ tra cứu đơn hàng và trạng thái giao hàng
- Giải quyết thắc mắc và khiếu nại của khách hàng

NGUYÊN TẮC GIAO TIẾP:
- Luôn lịch sự, thân thiện và nhiệt tình
- Trả lời ngắn gọn, dễ hiểu, tránh dài dòng
- Sử dụng emoji phù hợp để tạo cảm giác gần gũi ☕😊
- Nếu không chắc chắn, hãy thừa nhận và đề xuất chuyển sang nhân viên
- KHÔNG BAO GIỜ bịa đặt thông tin về sản phẩm hoặc giá cả
- Ưu tiên giải pháp có lợi cho khách hàng

THÔNG TIN QUÁN:
- Tên: NHH Coffee
- Sản phẩm: Cà phê (đen, sữa, espresso, latte, cappuccino...), Trà (đào cam sả, vải, sen, oolong...), Đá xay (chocolate, cookies & cream, dâu...), Nước ép & Sinh tố, Bánh ngọt (tiramisu, cheesecake, croissant...), Snack & Đồ ăn nhẹ, Combo tiết kiệm, Cà phê hạt (Arabica, Robusta, Blend)
- Giờ mở cửa: 7:00 - 23:00 hàng ngày
- Chính sách: Đổi trả trong 24h nếu có vấn đề về chất lượng
- Giao hàng: Miễn phí trong bán kính 3km cho đơn từ 100.000đ
- Điểm đặc biệt: Không gian yên tĩnh, WiFi miễn phí, phù hợp làm việc và học tập

CÁC TÌNH HUỐNG THƯỜNG GẶP:
1. Khách hỏi về đồ uống → Tư vấn dựa trên sở thích (đắng/ngọt, nóng/lạnh)
2. Khách hỏi giá → Nếu biết thì trả lời, không thì đề xuất xem menu
3. Khách muốn đặt món → Hướng dẫn đặt qua website/app hoặc đến quán
4. Khách hỏi khuyến mãi → Giới thiệu combo tiết kiệm và sản phẩm đang giảm giá
5. Khách khiếu nại → Lắng nghe, thấu hiểu, đề xuất giải pháp
6. Câu hỏi phức tạp → Đề xuất chuyển sang nhân viên tư vấn

GỢI Ý TƯ VẤN:
- Buổi sáng: Cà phê đen/sữa + Croissant/Bánh mì
- Buổi trưa: Trà đào cam sả/Trà vải + Sandwich/Snack
- Buổi chiều: Latte/Cappuccino + Bánh ngọt
- Buổi tối: Đá xay/Sinh tố + Bánh mousse
- Học bài/Làm việc: Americano/Cold Brew (caffeine cao, ít ngọt)
- Hẹn hò: Combo đôi (2 đồ uống + 1 bánh)

CÁCH TRẢ LỜI MẪU:
- "Chào bạn! Mình là trợ lý AI của NHH Coffee ☕ Mình có thể giúp gì cho bạn hôm nay? 😊"
- "Bạn thích vị đắng hay ngọt nhỉ? Để mình gợi ý món phù hợp nhé!"
- "Combo này rất tiết kiệm đấy, bạn có muốn thử không?"
- "Mình xin lỗi vì sự bất tiện này. Để mình kết nối bạn với nhân viên tư vấn nhé!"

Hãy bắt đầu cuộc trò chuyện một cách thân thiện và chuyên nghiệp!`

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatContext {
  userId?: number
  userName?: string
  sessionId?: string
  previousMessages?: ChatMessage[]
}

class GeminiService {
  private model: GenerativeModel
  private chatSessions: Map<string, ChatSession>

  constructor() {
    // Sử dụng gemini-2.5-flash (mới nhất, miễn phí, nhanh)
    this.model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
    })
    this.chatSessions = new Map()
  }

  /**
   * Gửi tin nhắn và nhận phản hồi từ AI
   */
  async chat(message: string, context?: ChatContext): Promise<string> {
    try {
      console.log('🤖 Gemini chat - Message:', message)
      
      // Thêm system prompt vào message
      const fullMessage = `${SYSTEM_PROMPT}\n\nKhách hàng: ${message}`
      
      const result = await this.model.generateContent(fullMessage)
      const response = result.response.text()

      console.log('🤖 Gemini response:', response)
      
      return response
    } catch (error: any) {
      console.error('❌ Gemini chat error:', error)
      console.error('❌ Error details:', error.message)
      throw new Error('Xin lỗi, AI đang gặp sự cố. Vui lòng thử lại sau.')
    }
  }

  /**
   * Tạo chat mới (reset conversation)
   */
  async startNewChat(sessionId: string, initialMessage?: string): Promise<string> {
    // Xóa session cũ nếu có
    this.chatSessions.delete(sessionId)

    // Tạo chat mới
    const chat = this.model.startChat()
    this.chatSessions.set(sessionId, chat)

    // Gửi message đầu tiên nếu có
    if (initialMessage) {
      return this.chat(initialMessage, { sessionId })
    }

    return 'Chào bạn! Mình là trợ lý AI của NHH Coffee. Mình có thể giúp gì cho bạn hôm nay? 😊'
  }

  /**
   * Xóa chat session
   */
  clearSession(sessionId: string): void {
    this.chatSessions.delete(sessionId)
  }

  /**
   * Build history từ previous messages
   */
  private buildHistory(messages: ChatMessage[]) {
    return messages
      .filter(msg => msg.role !== 'system')
      .map(msg => ({
        role: msg.role === 'user' ? 'user' as const : 'model' as const,
        parts: [{ text: msg.content }],
      }))
  }

  /**
   * Tạo embedding cho text (dùng cho RAG sau này)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'embedding-001' })
      const result = await embeddingModel.embedContent(text)
      return result.embedding.values
    } catch (error) {
      console.error('Generate embedding error:', error)
      throw error
    }
  }

  /**
   * Phân tích intent của user message
   */
  async detectIntent(message: string): Promise<{
    intent: string
    confidence: number
    entities: Record<string, string>
  }> {
    try {
      const prompt = `Phân tích ý định của câu sau và trả về JSON:
Câu: "${message}"

Trả về format:
{
  "intent": "product_inquiry" | "order_tracking" | "complaint" | "general_question" | "purchase_intent",
  "confidence": 0.0-1.0,
  "entities": {
    "product_type": "...",
    "price_range": "...",
    "order_id": "..."
  }
}

Chỉ trả về JSON, không giải thích.`

      const result = await this.model.generateContent(prompt)
      const response = result.response.text()
      
      // Parse JSON từ response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return {
        intent: 'general_question',
        confidence: 0.5,
        entities: {},
      }
    } catch (error) {
      console.error('Intent detection error:', error)
      return {
        intent: 'general_question',
        confidence: 0.5,
        entities: {},
      }
    }
  }

  /**
   * Tạo câu trả lời với context từ database
   */
  async chatWithContext(
    message: string,
    context: ChatContext & {
      products?: Array<{ name: string; price: number; description: string }>
      orderInfo?: { id: string; status: string; total: number }
    }
  ): Promise<string> {
    let enhancedMessage = message

    // Thêm thông tin sản phẩm nếu có
    if (context.products && context.products.length > 0) {
      const productsInfo = context.products
        .map((p, i) => `${i + 1}. ${p.name}\n   - Giá: ${p.price.toLocaleString()}đ\n   - Mô tả: ${p.description}`)
        .join('\n\n')
      
      enhancedMessage = `${SYSTEM_PROMPT}

Khách hàng hỏi: "${message}"

THÔNG TIN SẢN PHẨM TÌM ĐƯỢC:
${productsInfo}

HƯỚNG DẪN TRẢ LỜI:
1. Giới thiệu các sản phẩm phù hợp nhất với nhu cầu khách hàng
2. So sánh ưu nhược điểm nếu có nhiều sản phẩm
3. Đưa ra gợi ý dựa trên giá và tính năng
4. Hỏi thêm về ngân sách hoặc nhu cầu cụ thể nếu cần
5. Khuyến khích khách hàng đặt hàng hoặc xem chi tiết trên website

Hãy trả lời một cách tự nhiên, thân thiện và chuyên nghiệp.`
    }

    // Thêm thông tin đơn hàng nếu có
    if (context.orderInfo) {
      enhancedMessage = `${SYSTEM_PROMPT}

Khách hàng hỏi: "${message}"

THÔNG TIN ĐƠN HÀNG:
- Mã đơn hàng: #${context.orderInfo.id}
- Trạng thái: ${this.translateOrderStatus(context.orderInfo.status)}
- Tổng tiền: ${context.orderInfo.total.toLocaleString()}đ

HƯỚNG DẪN TRẢ LỜI:
1. Cung cấp thông tin đơn hàng một cách rõ ràng
2. Giải thích trạng thái hiện tại
3. Cho biết bước tiếp theo (nếu có)
4. Hỏi xem khách có cần hỗ trợ gì thêm không

Hãy trả lời một cách tự nhiên và thân thiện.`
    }

    return this.chat(enhancedMessage, context)
  }

  /**
   * Dịch trạng thái đơn hàng
   */
  private translateOrderStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'pending': 'Chờ xác nhận',
      'confirmed': 'Đã xác nhận',
      'processing': 'Đang xử lý',
      'shipping': 'Đang giao hàng',
      'delivered': 'Đã giao hàng',
      'cancelled': 'Đã hủy',
      'returned': 'Đã trả hàng'
    }
    return statusMap[status] || status
  }
}

// Export singleton instance
export const geminiService = new GeminiService()
