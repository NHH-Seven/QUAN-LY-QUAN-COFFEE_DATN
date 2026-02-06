// Test Gemini API trực tiếp
const { GoogleGenerativeAI } = require('@google/generative-ai')

const API_KEY = 'AIzaSyD6p382k9qvx_Mug4RizV9Oz-R5cUOewNI'

async function testGemini() {
  console.log('🧪 Testing Gemini API directly...\n')
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // Test với model khác nhau
    const models = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-pro',
      'models/gemini-1.5-flash-latest',
      'models/gemini-pro'
    ]
    
    for (const modelName of models) {
      try {
        console.log(`\n📝 Testing model: ${modelName}`)
        const model = genAI.getGenerativeModel({ model: modelName })
        const result = await model.generateContent('Xin chào')
        const response = result.response.text()
        console.log(`✅ SUCCESS with ${modelName}`)
        console.log(`📥 Response: ${response}\n`)
        break // Nếu thành công thì dừng
      } catch (error) {
        console.log(`❌ Failed with ${modelName}: ${error.message}`)
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testGemini()
