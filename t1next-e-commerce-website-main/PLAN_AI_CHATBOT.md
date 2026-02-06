# Plan: AI Chatbot Hỗ Trợ Khách Hàng

## Tổng quan
Xây dựng AI Chatbot thông minh để hỗ trợ khách hàng 24/7, tự động trả lời câu hỏi, tư vấn sản phẩm, và xử lý đơn hàng.

## Mục tiêu
- ✅ Trả lời tự động các câu hỏi thường gặp
- ✅ Tư vấn sản phẩm dựa trên nhu cầu khách hàng
- ✅ Hỗ trợ tra cứu đơn hàng, trạng thái giao hàng
- ✅ Chuyển sang nhân viên khi cần thiết
- ✅ Học từ lịch sử chat để cải thiện

## Công nghệ sử dụng

### Option 1: OpenAI GPT (Khuyên dùng)
- **API**: OpenAI GPT-4 hoặc GPT-3.5-turbo
- **Ưu điểm**: Thông minh, hiểu ngữ cảnh tốt, dễ tích hợp
- **Chi phí**: ~$0.002/1K tokens (GPT-3.5) hoặc ~$0.03/1K tokens (GPT-4)
- **Use case**: Tư vấn sản phẩm, trả lời câu hỏi phức tạp

### Option 2: Google Gemini (Miễn phí)
- **API**: Google Gemini API
- **Ưu điểm**: Miễn phí, tốc độ nhanh
- **Chi phí**: Free tier 60 requests/minute
- **Use case**: Phù hợp cho startup, traffic thấp

### Option 3: Anthropic Claude
- **API**: Claude API
- **Ưu điểm**: An toàn, ít hallucination
- **Chi phí**: Tương tự OpenAI

### Option 4: Self-hosted (Llama, Mistral)
- **Ưu điểm**: Không phụ thuộc bên thứ 3, riêng tư
- **Nhược điểm**: Cần server mạnh, phức tạp
- **Use case**: Doanh nghiệp lớn, yêu cầu bảo mật cao

## Kiến trúc hệ thống

```
┌─────────────┐
│   Client    │ (React Chat Widget)
└──────┬──────┘
       │ WebSocket/HTTP
       ▼
┌─────────────┐
│   Server    │ (Express.js)
│  Chat API   │
└──────┬──────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│  AI Service │   │  Database   │
│  (OpenAI)   │   │ (PostgreSQL)│
└─────────────┘   └─────────────┘
       │                 │
       │                 │
       ▼                 ▼
┌─────────────┐   ┌─────────────┐
│ Vector DB   │   │   Cache     │
│  (Pinecone) │   │   (Redis)   │
└─────────────┘   └─────────────┘
```

## Tính năng chi tiết

### Phase 1: Chatbot cơ bản (1-2 tuần)
1. **Chat Widget UI**
   - Floating button ở góc phải màn hình
   - Chat window với history
   - Typing indicator
   - Quick replies (câu hỏi gợi ý)

2. **Backend API**
   - POST /api/chat/message - Gửi tin nhắn
   - GET /api/chat/history - Lấy lịch sử
   - WebSocket cho real-time chat

3. **AI Integration**
   - Tích hợp OpenAI API
   - System prompt với context về sản phẩm
   - Function calling để tra cứu database

4. **Database Schema**
   ```sql
   -- Chat sessions
   CREATE TABLE chat_sessions (
     id UUID PRIMARY KEY,
     user_id INT REFERENCES users(id),
     started_at TIMESTAMP,
     ended_at TIMESTAMP,
     status VARCHAR(20) -- active, closed, transferred
   );

   -- Chat messages
   CREATE TABLE chat_messages (
     id UUID PRIMARY KEY,
     session_id UUID REFERENCES chat_sessions(id),
     role VARCHAR(20), -- user, assistant, system
     content TEXT,
     metadata JSONB, -- function calls, attachments
     created_at TIMESTAMP
   );

   -- AI training data
   CREATE TABLE chat_feedback (
     id UUID PRIMARY KEY,
     message_id UUID REFERENCES chat_messages(id),
     rating INT, -- 1-5 stars
     feedback TEXT,
     created_at TIMESTAMP
   );
   ```

### Phase 2: Tính năng nâng cao (2-3 tuần)
1. **RAG (Retrieval Augmented Generation)**
   - Vector database (Pinecone/Weaviate) để lưu knowledge base
   - Embedding sản phẩm, FAQ, chính sách
   - Semantic search để tìm thông tin liên quan

2. **Function Calling**
   - Tra cứu sản phẩm: `searchProducts(query, category, priceRange)`
   - Kiểm tra đơn hàng: `getOrderStatus(orderId)`
   - Tạo đơn hàng: `createOrder(items, address)`
   - Kiểm tra tồn kho: `checkInventory(productId)`

3. **Intent Detection**
   - Phân loại ý định: mua hàng, hỏi thông tin, khiếu nại
   - Routing đến workflow phù hợp
   - Escalate sang nhân viên khi cần

4. **Multi-language Support**
   - Tiếng Việt (chính)
   - Tiếng Anh
   - Auto-detect ngôn ngữ

### Phase 3: Tối ưu & Analytics (1-2 tuần)
1. **Analytics Dashboard**
   - Số lượng chat sessions
   - Thời gian phản hồi trung bình
   - Tỷ lệ giải quyết tự động
   - Top câu hỏi thường gặp
   - Customer satisfaction score

2. **A/B Testing**
   - Test các system prompts khác nhau
   - Test models khác nhau (GPT-3.5 vs GPT-4)
   - Đo lường conversion rate

3. **Caching & Optimization**
   - Cache câu trả lời cho câu hỏi phổ biến
   - Rate limiting
   - Cost optimization

## Implementation Plan

### Week 1-2: Setup & Basic Chat
- [ ] Thiết kế database schema
- [ ] Tạo chat widget UI (React component)
- [ ] Backend API endpoints
- [ ] Tích hợp OpenAI API
- [ ] Basic conversation flow

### Week 3-4: AI Enhancement
- [ ] Implement RAG với vector database
- [ ] Function calling cho product search
- [ ] Function calling cho order tracking
- [ ] Intent detection
- [ ] Context management

### Week 5-6: Advanced Features
- [ ] Handoff to human agent
- [ ] Multi-language support
- [ ] File upload (hình ảnh sản phẩm)
- [ ] Voice input (optional)
- [ ] Analytics dashboard

### Week 7-8: Testing & Optimization
- [ ] Load testing
- [ ] A/B testing
- [ ] Cost optimization
- [ ] Documentation
- [ ] Training cho staff

## Chi phí ước tính

### OpenAI API (GPT-3.5-turbo)
- 1000 conversations/day
- ~10 messages/conversation
- ~500 tokens/message
- Total: 5M tokens/day
- Cost: $10/day = $300/month

### Infrastructure
- Server: $20-50/month
- Vector DB (Pinecone): $70/month (starter)
- Redis: $10/month
- Total: ~$100/month

**Tổng chi phí: ~$400/month**

## System Prompt Template

```
Bạn là trợ lý AI của NHH Coffee, một cửa hàng cà phê và thiết bị điện tử.

NHIỆM VỤ:
- Tư vấn sản phẩm cho khách hàng
- Trả lời câu hỏi về sản phẩm, giá cả, chính sách
- Hỗ trợ tra cứu đơn hàng
- Giải quyết khiếu nại

NGUYÊN TẮC:
- Luôn lịch sự, thân thiện
- Trả lời ngắn gọn, dễ hiểu
- Nếu không chắc chắn, hỏi thêm hoặc chuyển sang nhân viên
- Không bịa đặt thông tin
- Ưu tiên giải pháp có lợi cho khách hàng

THÔNG TIN CỬA HÀNG:
- Địa chỉ: [địa chỉ]
- Giờ mở cửa: 8:00 - 22:00
- Hotline: [số điện thoại]
- Chính sách đổi trả: 7 ngày
- Miễn phí ship đơn > 500k

FUNCTIONS AVAILABLE:
- searchProducts: Tìm sản phẩm
- getOrderStatus: Kiểm tra đơn hàng
- createOrder: Tạo đơn hàng mới
- checkInventory: Kiểm tra tồn kho
```

## Code Structure

```
server/
├── src/
│   ├── services/
│   │   ├── ai/
│   │   │   ├── openai.service.ts      # OpenAI integration
│   │   │   ├── embeddings.service.ts  # Vector embeddings
│   │   │   ├── rag.service.ts         # RAG implementation
│   │   │   └── functions.ts           # Function definitions
│   │   └── chatbot.service.ts         # Main chatbot logic
│   ├── routes/
│   │   └── chatbot.ts                 # Chat API routes
│   └── db/
│       └── migrations/
│           └── add_chatbot.sql        # Database schema

client/
├── components/
│   ├── chatbot/
│   │   ├── chat-widget.tsx            # Main widget
│   │   ├── chat-window.tsx            # Chat interface
│   │   ├── message-list.tsx           # Message display
│   │   ├── message-input.tsx          # Input box
│   │   └── quick-replies.tsx          # Suggested questions
│   └── admin/
│       └── chatbot-analytics.tsx      # Analytics dashboard
```

## Testing Strategy

### Unit Tests
- AI service functions
- Message parsing
- Intent detection

### Integration Tests
- API endpoints
- Database operations
- OpenAI API calls

### E2E Tests
- Complete conversation flows
- Handoff to human
- Order creation flow

### Load Tests
- 100 concurrent users
- Response time < 2s
- Error rate < 1%

## Security Considerations

1. **API Key Protection**
   - Store OpenAI key in .env
   - Never expose to client
   - Rotate keys regularly

2. **Rate Limiting**
   - Max 10 messages/minute per user
   - Max 100 messages/hour per IP

3. **Input Validation**
   - Sanitize user input
   - Prevent prompt injection
   - Filter sensitive data

4. **Data Privacy**
   - Encrypt chat history
   - GDPR compliance
   - Allow users to delete data

## Monitoring & Alerts

1. **Metrics to Track**
   - API response time
   - Error rate
   - Token usage
   - Cost per conversation
   - User satisfaction

2. **Alerts**
   - API errors > 5%
   - Response time > 5s
   - Daily cost > $20
   - Low satisfaction score

## Next Steps

1. **Quyết định công nghệ**: OpenAI vs Gemini vs Self-hosted
2. **Setup development environment**
3. **Tạo prototype đơn giản**
4. **Test với real users**
5. **Iterate based on feedback**

## Resources

- OpenAI API Docs: https://platform.openai.com/docs
- Langchain (AI framework): https://js.langchain.com/
- Pinecone (Vector DB): https://www.pinecone.io/
- Vercel AI SDK: https://sdk.vercel.ai/

---

**Bạn muốn bắt đầu với Phase nào?**
- Phase 1: Basic chatbot (đơn giản, nhanh)
- Phase 2: Advanced với RAG (mạnh mẽ hơn)
- Prototype đơn giản để test ý tưởng
