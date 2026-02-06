import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const now = new Date()
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const promotions = [
    {
      code: 'WELCOME10',
      name: 'Chào mừng khách hàng mới',
      description: 'Giảm 10% cho đơn hàng đầu tiên của khách hàng mới',
      type: 'percentage' as const,
      value: 10,
      minOrderValue: 500000,
      maxDiscount: 200000,
      usageLimit: 1000,
      usedCount: 156,
      startDate: new Date('2024-01-01'),
      endDate: nextMonth,
      isActive: true,
    },
    {
      code: 'SALE20',
      name: 'Flash Sale 20%',
      description: 'Giảm 20% tất cả sản phẩm - Chỉ trong tuần này!',
      type: 'percentage' as const,
      value: 20,
      minOrderValue: 1000000,
      maxDiscount: 500000,
      usageLimit: 500,
      usedCount: 234,
      startDate: now,
      endDate: nextWeek,
      isActive: true,
    },
    {
      code: 'FREESHIP',
      name: 'Miễn phí vận chuyển',
      description: 'Giảm 50.000đ phí ship cho đơn hàng từ 300.000đ',
      type: 'fixed' as const,
      value: 50000,
      minOrderValue: 300000,
      maxDiscount: null,
      usageLimit: null,
      usedCount: 1205,
      startDate: new Date('2024-01-01'),
      endDate: null,
      isActive: true,
    },
    {
      code: 'NEWYEAR2025',
      name: 'Mừng năm mới 2025',
      description: 'Giảm 15% đón chào năm mới 2025',
      type: 'percentage' as const,
      value: 15,
      minOrderValue: 2000000,
      maxDiscount: 1000000,
      usageLimit: 2000,
      usedCount: 567,
      startDate: new Date('2024-12-25'),
      endDate: new Date('2025-01-15'),
      isActive: true,
    },
    {
      code: 'VIP500K',
      name: 'Ưu đãi VIP',
      description: 'Giảm 500.000đ cho khách hàng VIP - Đơn từ 5 triệu',
      type: 'fixed' as const,
      value: 500000,
      minOrderValue: 5000000,
      maxDiscount: null,
      usageLimit: 100,
      usedCount: 45,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
    {
      code: 'SUMMER30',
      name: 'Khuyến mãi hè 2024',
      description: 'Giảm 30% mùa hè - Đã kết thúc',
      type: 'percentage' as const,
      value: 30,
      minOrderValue: 1000000,
      maxDiscount: 800000,
      usageLimit: 1000,
      usedCount: 1000,
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      isActive: false,
    },
    {
      code: 'TECH100K',
      name: 'Giảm 100K đồ công nghệ',
      description: 'Áp dụng cho điện thoại, laptop, tablet',
      type: 'fixed' as const,
      value: 100000,
      minOrderValue: 1000000,
      maxDiscount: null,
      usageLimit: 500,
      usedCount: 89,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
    {
      code: 'MEMBER25',
      name: 'Ưu đãi thành viên Gold',
      description: 'Giảm 25% dành riêng cho thành viên Gold trở lên',
      type: 'percentage' as const,
      value: 25,
      minOrderValue: 3000000,
      maxDiscount: 1500000,
      usageLimit: 200,
      usedCount: 78,
      startDate: now,
      endDate: nextMonth,
      isActive: true,
    },
  ]

  console.log('🎫 Adding promotions...')
  
  for (const p of promotions) {
    await prisma.promotion.upsert({
      where: { code: p.code },
      update: p,
      create: p,
    })
    console.log(`   ✅ ${p.code} - ${p.name}`)
  }
  
  const count = await prisma.promotion.count()
  console.log(`\n🎉 Total promotions: ${count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
