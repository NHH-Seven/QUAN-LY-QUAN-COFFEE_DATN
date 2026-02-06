// Fix chatbot knowledge encoding
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: 'postgresql://postgres:123456@localhost:5432/ecommerce',
  client_encoding: 'UTF8'
})

async function fix() {
  try {
    console.log('🔧 Fixing chatbot knowledge encoding...')
    
    // Delete old data
    await pool.query('DELETE FROM chatbot_knowledge')
    console.log('✅ Deleted old data')
    
    // Insert with correct encoding
    const knowledge = [
      {
        title: 'Giờ mở cửa',
        content: 'NHH Coffee mở cửa từ 7h sáng đến 10h tối hàng ngày, kể cả cuối tuần và ngày lễ.',
        category: 'thông tin quán',
        tags: ['giờ', 'mở cửa', 'thời gian']
      },
      {
        title: 'Wifi miễn phí',
        content: 'Quán có wifi miễn phí cho khách. Mật khẩu: NHHCoffee2024',
        category: 'tiện ích',
        tags: ['wifi', 'internet', 'mật khẩu']
      },
      {
        title: 'Bãi đậu xe',
        content: 'Quán có bãi đậu xe miễn phí cho khách ở phía sau quán, sức chứa khoảng 20 xe máy và 5 ô tô.',
        category: 'tiện ích',
        tags: ['đậu xe', 'bãi xe', 'parking']
      },
      {
        title: 'Đặt bàn trước',
        content: 'Quý khách có thể đặt bàn trước qua hotline 1900-xxxx hoặc trực tiếp tại quán. Đặt bàn từ 2 người trở lên.',
        category: 'dịch vụ',
        tags: ['đặt bàn', 'reservation', 'booking']
      },
      {
        title: 'Giao hàng tận nơi',
        content: 'NHH Coffee có dịch vụ giao hàng tận nơi trong bán kính 5km. Phí ship từ 15.000đ. Đơn hàng từ 200.000đ được miễn phí ship.',
        category: 'dịch vụ',
        tags: ['giao hàng', 'ship', 'delivery']
      },
      {
        title: 'Chương trình khách hàng thân thiết',
        content: 'Tích điểm mỗi lần mua hàng. 1.000đ = 1 điểm. Đổi điểm lấy voucher giảm giá và quà tặng hấp dẫn.',
        category: 'khuyến mãi',
        tags: ['tích điểm', 'loyalty', 'thành viên']
      }
    ]
    
    for (const item of knowledge) {
      await pool.query(
        `INSERT INTO chatbot_knowledge (title, content, category, tags, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [item.title, item.content, item.category, item.tags]
      )
    }
    
    console.log('✅ Inserted ' + knowledge.length + ' knowledge items')
    
    // Verify
    const result = await pool.query('SELECT id, title, content, category FROM chatbot_knowledge')
    console.log('\n📋 Current data:')
    result.rows.forEach(row => {
      console.log(`- ${row.title}: ${row.content.substring(0, 50)}...`)
    })
    
    console.log('\n🎉 Done!')
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await pool.end()
  }
}

fix()
