/**
 * Script thêm dữ liệu đơn hàng cho báo cáo
 * Tạo đơn hàng trong 3 tháng gần đây với các trạng thái khác nhau
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper: tạo ngày ngẫu nhiên trong khoảng
function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

// Helper: chọn ngẫu nhiên từ array
function randomItem<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// Helper: số ngẫu nhiên trong khoảng
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function main() {
  console.log('📊 Adding report sample data...')

  // Lấy users và products hiện có
  const users = await prisma.user.findMany({ where: { role: 'user' } })
  const products = await prisma.product.findMany()

  if (users.length === 0 || products.length === 0) {
    console.log('❌ Cần chạy seed-prisma.ts trước!')
    return
  }

  const statuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'] as const
  const paymentMethods = ['cod', 'bank_transfer', 'momo', 'vnpay']
  
  // Tạo đơn hàng trong 90 ngày gần đây
  const now = new Date()
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  const ordersToCreate = 50 // Tạo 50 đơn hàng mới

  console.log(`🛒 Creating ${ordersToCreate} orders...`)

  for (let i = 0; i < ordersToCreate; i++) {
    const user = randomItem(users)
    const orderDate = randomDate(threeMonthsAgo, now)
    
    // Chọn 1-4 sản phẩm ngẫu nhiên
    const numProducts = randomInt(1, 4)
    const selectedProducts = []
    const usedIndexes = new Set<number>()
    
    for (let j = 0; j < numProducts; j++) {
      let idx: number
      do {
        idx = randomInt(0, products.length - 1)
      } while (usedIndexes.has(idx))
      usedIndexes.add(idx)
      selectedProducts.push({
        product: products[idx],
        quantity: randomInt(1, 3)
      })
    }

    // Tính tổng tiền
    let total = 0
    for (const item of selectedProducts) {
      total += Number(item.product.price) * item.quantity
    }

    // Giảm giá ngẫu nhiên (0-15%)
    const discountPercent = Math.random() < 0.3 ? randomInt(5, 15) : 0
    const discountAmount = Math.round(total * discountPercent / 100)
    total = total - discountAmount

    // Xác định status dựa trên ngày
    const daysSinceOrder = Math.floor((now.getTime() - orderDate.getTime()) / (24 * 60 * 60 * 1000))
    let status: typeof statuses[number]
    
    if (daysSinceOrder > 14) {
      // Đơn cũ: 80% delivered, 10% cancelled, 10% khác
      const rand = Math.random()
      if (rand < 0.8) status = 'delivered'
      else if (rand < 0.9) status = 'cancelled'
      else status = randomItem(['confirmed', 'shipping'])
    } else if (daysSinceOrder > 7) {
      // Đơn 1-2 tuần: 50% delivered, 30% shipping, 20% khác
      const rand = Math.random()
      if (rand < 0.5) status = 'delivered'
      else if (rand < 0.8) status = 'shipping'
      else status = randomItem(['confirmed', 'pending'])
    } else {
      // Đơn mới: đa dạng trạng thái
      status = randomItem(statuses)
    }

    // Tạo đơn hàng
    const order = await prisma.order.create({
      data: {
        userId: user.id,
        total,
        discountAmount,
        status,
        shippingAddress: user.address || '123 Đường ABC, TP.HCM',
        paymentMethod: randomItem(paymentMethods),
        recipientName: user.name,
        phone: user.phone || '0901234567',
        note: Math.random() < 0.2 ? 'Giao giờ hành chính' : null,
        createdAt: orderDate,
      },
    })

    // Tạo order items
    for (const item of selectedProducts) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        },
      })
    }

    // Progress
    if ((i + 1) % 10 === 0) {
      console.log(`   Created ${i + 1}/${ordersToCreate} orders...`)
    }
  }

  // Thêm stock transactions
  console.log('📦 Adding stock transactions...')
  const warehouseUser = await prisma.user.findFirst({ where: { role: 'warehouse' } })
  
  if (warehouseUser) {
    const transactionTypes = ['import', 'export', 'adjust', 'order', 'return'] as const
    
    for (let i = 0; i < 30; i++) {
      const product = randomItem(products)
      const type = randomItem(transactionTypes) as 'import' | 'export' | 'adjust' | 'order' | 'return'
      const quantity = randomInt(5, 50)
      const stockBefore = randomInt(10, 100)
      const stockAfter = type === 'import' || type === 'return' 
        ? stockBefore + quantity 
        : Math.max(0, stockBefore - quantity)

      await prisma.stockTransaction.create({
        data: {
          productId: product.id,
          userId: warehouseUser.id,
          type,
          quantity,
          reason: type === 'import' ? 'Nhập hàng từ nhà cung cấp' 
                : type === 'export' ? 'Xuất hàng cho đại lý'
                : type === 'order' ? 'Xuất theo đơn hàng'
                : type === 'return' ? 'Khách trả hàng'
                : 'Kiểm kê điều chỉnh',
          reference: `${type.toUpperCase()}-${Date.now()}-${i}`,
          stockBefore,
          stockAfter,
          createdAt: randomDate(threeMonthsAgo, now),
        },
      })
    }
  }

  // Thêm reviews
  console.log('⭐ Adding more reviews...')
  const comments = [
    'Sản phẩm tốt, đóng gói cẩn thận!',
    'Giao hàng nhanh, chất lượng OK',
    'Rất hài lòng với sản phẩm này',
    'Giá cả hợp lý, sẽ mua lại',
    'Chất lượng tuyệt vời, đáng tiền',
    'Sản phẩm đúng mô tả, recommend!',
    'Shop tư vấn nhiệt tình',
    'Đã mua lần 2, vẫn rất ưng',
    'Hàng chính hãng, yên tâm',
    'Giao hàng hơi chậm nhưng hàng OK',
  ]

  for (let i = 0; i < 20; i++) {
    const user = randomItem(users)
    const product = randomItem(products)
    
    // Check if review already exists
    const existing = await prisma.review.findFirst({
      where: { userId: user.id, productId: product.id }
    })
    
    if (!existing) {
      await prisma.review.create({
        data: {
          userId: user.id,
          productId: product.id,
          rating: randomInt(3, 5),
          comment: randomItem(comments),
          createdAt: randomDate(threeMonthsAgo, now),
        },
      })
    }
  }

  // Cập nhật user stats
  console.log('👥 Updating user statistics...')
  for (const user of users) {
    const userOrders = await prisma.order.findMany({
      where: { userId: user.id, status: 'delivered' }
    })
    
    const totalSpent = userOrders.reduce((sum, o) => sum + Number(o.total), 0)
    const orderCount = userOrders.length
    const points = Math.floor(totalSpent / 100000) // 1 điểm / 100k
    
    let tier = 'bronze'
    if (points >= 5000) tier = 'diamond'
    else if (points >= 2000) tier = 'gold'
    else if (points >= 500) tier = 'silver'

    await prisma.user.update({
      where: { id: user.id },
      data: { totalSpent, orderCount, points, tier }
    })
  }

  // Summary
  const totalOrders = await prisma.order.count()
  const totalRevenue = await prisma.order.aggregate({
    where: { status: 'delivered' },
    _sum: { total: true }
  })
  const totalReviews = await prisma.review.count()
  const totalTransactions = await prisma.stockTransaction.count()

  console.log('\n🎉 Report data added successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📊 Total Orders: ${totalOrders}`)
  console.log(`💰 Total Revenue (delivered): ${Number(totalRevenue._sum.total || 0).toLocaleString('vi-VN')}đ`)
  console.log(`⭐ Total Reviews: ${totalReviews}`)
  console.log(`📦 Total Stock Transactions: ${totalTransactions}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
