import { pool } from './index.js'
import bcrypt from 'bcryptjs'

/**
 * Seed dữ liệu mẫu giống cửa hàng thật
 * - 50 khách hàng
 * - 200+ đơn hàng trong 90 ngày qua
 * - Reviews cho sản phẩm
 * - Mã giảm giá
 */

// Tên Việt Nam ngẫu nhiên
const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương']
const middleNames = ['Văn', 'Thị', 'Hoàng', 'Minh', 'Thanh', 'Quốc', 'Đức', 'Hữu', 'Công', 'Xuân', 'Thu', 'Ngọc', 'Kim', 'Anh', 'Bảo']
const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Em', 'Phúc', 'Giang', 'Hải', 'Hùng', 'Khoa', 'Linh', 'Mai', 'Nam', 'Oanh', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Uyên', 'Việt', 'Yến', 'Hà', 'Lan', 'Thảo', 'Trang']

const districts = ['Hải Thịnh', 'Hải Hậu', 'Trực Ninh', 'Xuân Trường', 'Giao Thủy', 'Nghĩa Hưng', 'Nam Trực', 'Vụ Bản', 'Ý Yên', 'Mỹ Lộc']
const streets = ['Trần Hưng Đạo', 'Lê Lợi', 'Nguyễn Du', 'Hai Bà Trưng', 'Quang Trung', 'Lý Thường Kiệt', 'Nguyễn Trãi', 'Đinh Tiên Hoàng', 'Trần Phú', 'Nguyễn Văn Cừ']

const reviewComments = [
  'Đồ uống rất ngon, đúng như mô tả. Giao hàng nhanh!',
  'Chất lượng tuyệt vời, đáng đồng tiền bát gạo.',
  'Mình rất hài lòng với món này. Sẽ ủng hộ quán tiếp.',
  'Đóng gói cẩn thận, đồ uống còn nguyên. 5 sao!',
  'Giá cả hợp lý, chất lượng ok. Recommend cho mọi người.',
  'Cà phê thơm ngon, đậm đà. Quán uy tín.',
  'Giao hàng hơi chậm nhưng đồ uống ngon nên cho 5 sao.',
  'Mua lần 2 rồi, vẫn rất hài lòng như lần đầu.',
  'Nhân viên tư vấn nhiệt tình, đồ uống đúng mô tả.',
  'Giá tốt, chất lượng không chê vào đâu được.',
  'Cà phê xịn, uống rất ngon. Cảm ơn quán!',
  'Đã so sánh nhiều nơi, quán này giá tốt và uy tín nhất.',
  'Đồ uống ngon, chất lượng cao. Sẽ giới thiệu bạn bè.',
  'Mình order tối, sáng hôm sau đã nhận được. Quá nhanh!',
  'Đồ uống như hình, không khác gì. Very good!',
]

const random = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
const randomPhone = () => `09${randomInt(10000000, 99999999)}`

function randomDate(daysAgo: number): Date {
  const now = new Date()
  const past = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()))
}

async function seedSampleData() {
  const client = await pool.connect()
  
  try {
    console.log('🌱 Seeding sample data...')
    
    await client.query('BEGIN')

    // 1. Tạo 50 khách hàng mẫu
    console.log('👥 Creating sample customers...')
    const customerIds: string[] = []
    const hashedPassword = await bcrypt.hash('customer123', 10)
    
    for (let i = 1; i <= 50; i++) {
      const name = `${random(firstNames)} ${random(middleNames)} ${random(lastNames)}`
      const email = `customer${i}@gmail.com`
      const phone = randomPhone()
      const address = `${randomInt(1, 500)} ${random(streets)}, ${random(districts)}, Tỉnh Nam Định`
      
      const result = await client.query(
        `INSERT INTO users (id, email, password, name, phone, address, role, is_active, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'user', true, $6)
         ON CONFLICT (email) DO NOTHING
         RETURNING id`,
        [email, hashedPassword, name, phone, address, randomDate(180)]
      )
      
      if (result.rows[0]) {
        customerIds.push(result.rows[0].id)
      }
    }
    console.log(`✅ Created ${customerIds.length} customers`)

    // Lấy danh sách sản phẩm
    const productsResult = await client.query('SELECT id, price, name FROM products')
    const products = productsResult.rows

    // 2. Tạo 200+ đơn hàng trong 90 ngày qua
    console.log('📦 Creating sample orders...')
    const statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled']
    const paymentMethods = ['cash', 'card', 'transfer', 'cod']
    let orderCount = 0
    
    // Phân bố đơn hàng: nhiều hơn vào cuối tuần và gần đây
    for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
      // Số đơn mỗi ngày: 1-5 đơn, cuối tuần nhiều hơn
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const ordersToday = randomInt(isWeekend ? 3 : 1, isWeekend ? 8 : 5)
      
      for (let j = 0; j < ordersToday; j++) {
        const customerId = random(customerIds)
        const orderDate = randomDate(daysAgo)
        
        // Đơn cũ hơn có xu hướng delivered, đơn mới hơn có nhiều trạng thái hơn
        let status: string
        if (daysAgo > 30) {
          status = Math.random() > 0.1 ? 'delivered' : 'cancelled'
        } else if (daysAgo > 7) {
          status = random(['confirmed', 'shipping', 'delivered', 'delivered', 'delivered'])
        } else if (daysAgo > 2) {
          status = random(['pending', 'confirmed', 'shipping', 'delivered'])
        } else {
          status = random(['pending', 'pending', 'confirmed'])
        }
        
        const paymentMethod = random(paymentMethods)
        const isPOS = Math.random() > 0.7 // 30% là đơn POS
        
        // Chọn 1-4 sản phẩm ngẫu nhiên
        const numItems = randomInt(1, 4)
        const selectedProducts = []
        const usedProductIds = new Set()
        
        for (let k = 0; k < numItems; k++) {
          let product
          do {
            product = random(products)
          } while (usedProductIds.has(product.id))
          usedProductIds.add(product.id)
          selectedProducts.push({
            ...product,
            quantity: randomInt(1, 2)
          })
        }
        
        const total = selectedProducts.reduce((sum, p) => sum + Number(p.price) * p.quantity, 0)
        
        // Tạo đơn hàng
        const orderResult = await client.query(
          `INSERT INTO orders (id, user_id, total, status, shipping_address, payment_method, recipient_name, phone, note, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id`,
          [
            isPOS ? null : customerId,
            total,
            status,
            isPOS ? 'Mua tại cửa hàng' : `${randomInt(1, 500)} ${random(streets)}, ${random(districts)}, Tỉnh Nam Định`,
            paymentMethod,
            `${random(firstNames)} ${random(middleNames)} ${random(lastNames)}`,
            randomPhone(),
            isPOS ? `POS - Nhân viên: staff@nhh-coffee.com` : null,
            orderDate
          ]
        )
        
        const orderId = orderResult.rows[0].id
        
        // Tạo order items
        for (const item of selectedProducts) {
          await client.query(
            `INSERT INTO order_items (id, order_id, product_id, quantity, price)
             VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
            [orderId, item.id, item.quantity, item.price]
          )
        }
        
        orderCount++
      }
    }
    console.log(`✅ Created ${orderCount} orders`)

    // 3. Tạo reviews cho sản phẩm
    console.log('⭐ Creating sample reviews...')
    let reviewCount = 0
    
    for (const product of products) {
      // Mỗi sản phẩm có 3-15 reviews
      const numReviews = randomInt(3, 15)
      
      for (let i = 0; i < numReviews; i++) {
        const customerId = random(customerIds)
        const rating = randomInt(3, 5) // Đa số review tốt (3-5 sao)
        const comment = random(reviewComments)
        
        await client.query(
          `INSERT INTO reviews (id, user_id, product_id, rating, comment, created_at)
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [customerId, product.id, rating, comment, randomDate(60)]
        )
        reviewCount++
      }
    }
    console.log(`✅ Created ${reviewCount} reviews`)

    // 4. Tạo mã giảm giá mẫu
    console.log('🏷️ Creating sample promotions...')
    const promotions = [
      { code: 'WELCOME10', name: 'Chào mừng khách mới', type: 'percentage', value: 10, minOrder: 100000, maxDiscount: 50000, usageLimit: 100 },
      { code: 'SALE20', name: 'Giảm 20% đơn hàng', type: 'percentage', value: 20, minOrder: 200000, maxDiscount: 100000, usageLimit: 50 },
      { code: 'FREESHIP', name: 'Miễn phí vận chuyển', type: 'fixed', value: 15000, minOrder: 100000, maxDiscount: null, usageLimit: 200 },
      { code: 'NEWYEAR2026', name: 'Mừng năm mới 2026', type: 'percentage', value: 15, minOrder: 150000, maxDiscount: 50000, usageLimit: 100 },
      { code: 'VIP30', name: 'Ưu đãi VIP', type: 'fixed', value: 50000, minOrder: 300000, maxDiscount: null, usageLimit: 20 },
      { code: 'FLASH30', name: 'Flash Sale 30%', type: 'percentage', value: 30, minOrder: 100000, maxDiscount: 80000, usageLimit: 30 },
      { code: 'MEMBER20K', name: 'Giảm 20K cho thành viên', type: 'fixed', value: 20000, minOrder: 100000, maxDiscount: null, usageLimit: 500 },
      { code: 'COFFEE15', name: 'Giảm 15% đồ uống', type: 'percentage', value: 15, minOrder: 80000, maxDiscount: 30000, usageLimit: 100 },
    ]
    
    for (const promo of promotions) {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - randomInt(0, 30))
      const endDate = new Date()
      endDate.setDate(endDate.getDate() + randomInt(30, 90))
      
      await client.query(
        `INSERT INTO promotions (id, code, name, type, value, min_order_value, max_discount, usage_limit, used_count, start_date, end_date, is_active)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
         ON CONFLICT DO NOTHING`,
        [promo.code, promo.name, promo.type, promo.value, promo.minOrder, promo.maxDiscount, promo.usageLimit, randomInt(0, 20), startDate, endDate]
      )
    }
    console.log(`✅ Created ${promotions.length} promotions`)

    // 5. Cập nhật rating và review_count cho products
    console.log('📊 Updating product ratings...')
    await client.query(`
      UPDATE products p SET 
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM reviews WHERE product_id = p.id), 0),
        review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = p.id)
    `)
    console.log('✅ Updated product ratings')

    await client.query('COMMIT')
    
    console.log('')
    console.log('🎉 Sample data seeded successfully!')
    console.log('📊 Summary:')
    console.log(`   - ${customerIds.length} customers (password: customer123)`)
    console.log(`   - ${orderCount} orders`)
    console.log(`   - ${reviewCount} reviews`)
    console.log(`   - ${promotions.length} promotions`)
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('❌ Seeding failed:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

seedSampleData()
