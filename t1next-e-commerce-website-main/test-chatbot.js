// Test AI Chatbot API
const API_URL = 'http://localhost:3001/api'

async function testChatbot() {
  console.log('🤖 Testing AI Chatbot...\n')

  try {
    // Test 1: Send a message
    console.log('📤 Sending message: "Xin chào"')
    const response = await fetch(`${API_URL}/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Xin chào',
        guestId: 'test-' + Date.now()
      })
    })

    const data = await response.json()
    
    if (data.success) {
      console.log('✅ Success!')
      console.log('📥 AI Response:', data.data.response)
      console.log('🆔 Session ID:', data.data.sessionId)
      
      // Test 2: Follow-up message
      console.log('\n📤 Sending follow-up: "Sản phẩm nào đang khuyến mãi?"')
      const response2 = await fetch(`${API_URL}/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Sản phẩm nào đang khuyến mãi?',
          guestId: 'test-' + Date.now()
        })
      })

      const data2 = await response2.json()
      if (data2.success) {
        console.log('✅ Success!')
        console.log('📥 AI Response:', data2.data.response)
      }
    } else {
      console.error('❌ Error:', data.error)
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testChatbot()
