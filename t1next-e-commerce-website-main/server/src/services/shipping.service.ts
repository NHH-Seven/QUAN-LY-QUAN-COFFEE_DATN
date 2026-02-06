/**
 * Shipping Service
 * Tính phí vận chuyển theo khu vực và trọng lượng
 */

interface ShippingRate {
  region: string
  baseFee: number
  freeShippingThreshold: number
}

// Phí vận chuyển theo khu vực
const SHIPPING_RATES: ShippingRate[] = [
  { region: 'hcm', baseFee: 0, freeShippingThreshold: 0 }, // HCM miễn phí
  { region: 'hanoi', baseFee: 20000, freeShippingThreshold: 500000 },
  { region: 'mien_nam', baseFee: 25000, freeShippingThreshold: 500000 },
  { region: 'mien_trung', baseFee: 35000, freeShippingThreshold: 800000 },
  { region: 'mien_bac', baseFee: 30000, freeShippingThreshold: 500000 },
  { region: 'default', baseFee: 40000, freeShippingThreshold: 1000000 },
]

// Từ khóa để detect khu vực từ địa chỉ
const REGION_KEYWORDS: Record<string, string[]> = {
  hcm: ['hồ chí minh', 'hcm', 'sài gòn', 'saigon', 'tp.hcm', 'tphcm', 'quận 1', 'quận 2', 'quận 3', 'quận 4', 'quận 5', 'quận 6', 'quận 7', 'quận 8', 'quận 9', 'quận 10', 'quận 11', 'quận 12', 'bình thạnh', 'gò vấp', 'tân bình', 'tân phú', 'phú nhuận', 'thủ đức', 'bình tân', 'củ chi', 'hóc môn', 'nhà bè', 'cần giờ'],
  hanoi: ['hà nội', 'hanoi', 'ha noi', 'hoàn kiếm', 'ba đình', 'đống đa', 'hai bà trưng', 'hoàng mai', 'thanh xuân', 'cầu giấy', 'long biên', 'tây hồ', 'nam từ liêm', 'bắc từ liêm', 'hà đông'],
  mien_nam: ['bình dương', 'đồng nai', 'long an', 'tây ninh', 'bà rịa', 'vũng tàu', 'bình phước', 'cần thơ', 'an giang', 'kiên giang', 'cà mau', 'bạc liêu', 'sóc trăng', 'trà vinh', 'vĩnh long', 'đồng tháp', 'tiền giang', 'bến tre', 'hậu giang'],
  mien_trung: ['đà nẵng', 'huế', 'quảng nam', 'quảng ngãi', 'bình định', 'phú yên', 'khánh hòa', 'nha trang', 'ninh thuận', 'bình thuận', 'quảng bình', 'quảng trị', 'hà tĩnh', 'nghệ an', 'thanh hóa', 'kon tum', 'gia lai', 'đắk lắk', 'đắk nông', 'lâm đồng', 'đà lạt'],
  mien_bac: ['hải phòng', 'quảng ninh', 'hải dương', 'hưng yên', 'thái bình', 'nam định', 'ninh bình', 'bắc ninh', 'bắc giang', 'vĩnh phúc', 'phú thọ', 'thái nguyên', 'lạng sơn', 'cao bằng', 'bắc kạn', 'tuyên quang', 'hà giang', 'lào cai', 'yên bái', 'điện biên', 'lai châu', 'sơn la', 'hòa bình'],
}

/**
 * Detect region from address string
 */
export function detectRegion(address: string): string {
  const normalizedAddress = address.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')

  for (const [region, keywords] of Object.entries(REGION_KEYWORDS)) {
    for (const keyword of keywords) {
      const normalizedKeyword = keyword.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
      
      if (normalizedAddress.includes(normalizedKeyword)) {
        return region
      }
    }
  }

  return 'default'
}

/**
 * Calculate shipping fee
 */
export function calculateShippingFee(address: string, orderTotal: number): {
  fee: number
  region: string
  freeShippingThreshold: number
  isFreeShipping: boolean
} {
  const region = detectRegion(address)
  const rate = SHIPPING_RATES.find(r => r.region === region) || SHIPPING_RATES.find(r => r.region === 'default')!

  const isFreeShipping = orderTotal >= rate.freeShippingThreshold
  const fee = isFreeShipping ? 0 : rate.baseFee

  return {
    fee,
    region,
    freeShippingThreshold: rate.freeShippingThreshold,
    isFreeShipping
  }
}

/**
 * Get all shipping rates (for display)
 */
export function getShippingRates(): ShippingRate[] {
  return SHIPPING_RATES.filter(r => r.region !== 'default')
}
