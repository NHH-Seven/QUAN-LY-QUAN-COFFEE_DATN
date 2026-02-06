// List available Gemini models
const { GoogleGenerativeAI } = require('@google/generative-ai')

const API_KEY = 'AIzaSyD6p382k9qvx_Mug4RizV9Oz-R5cUOewNI'

async function listModels() {
  console.log('📋 Listing available Gemini models...\n')
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY)
    
    // Try to list models
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + API_KEY)
    const data = await response.json()
    
    if (data.models) {
      console.log('✅ Available models:')
      data.models.forEach(model => {
        console.log(`  - ${model.name}`)
        console.log(`    Display name: ${model.displayName}`)
        console.log(`    Supported methods: ${model.supportedGenerationMethods?.join(', ')}`)
        console.log()
      })
    } else {
      console.log('❌ Error:', data)
    }
  } catch (error) {
    console.error('❌ Failed:', error.message)
  }
}

listModels()
