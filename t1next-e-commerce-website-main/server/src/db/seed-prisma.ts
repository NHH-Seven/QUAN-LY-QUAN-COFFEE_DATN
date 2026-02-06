import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as dotenv from 'dotenv'

dotenv.config()

const prisma = new PrismaClient()

// ==================== CATEGORIES ====================
const categories = [
  { name: 'Điện thoại', slug: 'dien-thoai', icon: 'smartphone', description: 'Smartphone cao cấp từ các thương hiệu hàng đầu', productCount: 5 },
  { name: 'Laptop', slug: 'laptop', icon: 'laptop', description: 'Laptop văn phòng, gaming và workstation', productCount: 4 },
  { name: 'Tablet', slug: 'tablet', icon: 'tablet', description: 'Máy tính bảng đa năng', productCount: 2 },
  { name: 'PC & Gaming', slug: 'pc-gaming', icon: 'monitor', description: 'PC Gaming và máy tính để bàn', productCount: 3 },
  { name: 'Màn hình', slug: 'man-hinh', icon: 'tv', description: 'Màn hình gaming và văn phòng', productCount: 2 },
  { name: 'Linh kiện PC', slug: 'linh-kien', icon: 'cpu', description: 'CPU, GPU, RAM, SSD và linh kiện máy tính', productCount: 0 },
  { name: 'TV & Âm thanh', slug: 'tv-am-thanh', icon: 'speaker', description: 'TV, loa, soundbar và thiết bị âm thanh', productCount: 0 },
  { name: 'Phụ kiện', slug: 'phu-kien', icon: 'headphones', description: 'Tai nghe, chuột, bàn phím và phụ kiện', productCount: 7 },
  { name: 'Đồng hồ thông minh', slug: 'dong-ho', icon: 'watch', description: 'Smartwatch và thiết bị đeo', productCount: 1 },
  { name: 'Camera & Máy ảnh', slug: 'camera', icon: 'camera', description: 'Camera, máy ảnh và phụ kiện quay phim', productCount: 0 },
]

// ==================== PRODUCTS ====================
const products = [
  // Điện thoại
  {
    name: 'iPhone 15 Pro Max 256GB',
    slug: 'iphone-15-pro-max-256gb',
    description: 'iPhone 15 Pro Max với chip A17 Pro mạnh mẽ nhất, camera 48MP với khả năng zoom quang học 5x, khung titan cao cấp siêu nhẹ và bền. Hỗ trợ USB-C và Action Button mới.',
    price: 29990000,
    originalPrice: 34990000,
    images: ['/iphone-15-pro-max-titanium-black-smartphone.jpg', '/iphone-15-pro-max-titanium-black.jpg'],
    categorySlug: 'dien-thoai',
    brand: 'Apple',
    specs: { 'Màn hình': '6.7 inch Super Retina XDR OLED', 'Chip': 'A17 Pro', 'RAM': '8GB', 'Bộ nhớ': '256GB', 'Camera': '48MP + 12MP + 12MP', 'Pin': '4422mAh' },
    stock: 50, rating: 4.9, reviewCount: 234, isNew: true, isFeatured: true, discount: 14
  },
  {
    name: 'Samsung Galaxy S24 Ultra 512GB',
    slug: 'samsung-galaxy-s24-ultra-512gb',
    description: 'Galaxy S24 Ultra với Galaxy AI tiên tiến, S Pen tích hợp, camera 200MP siêu nét. Khung Titan bền bỉ, màn hình Dynamic AMOLED 2X sáng nhất.',
    price: 31990000,
    originalPrice: 36990000,
    images: ['/samsung-galaxy-s24-ultra-titanium-gray.jpg', '/samsung-galaxy-s24-ultra-titanium-gray-smartphone.jpg'],
    categorySlug: 'dien-thoai',
    brand: 'Samsung',
    specs: { 'Màn hình': '6.8 inch Dynamic AMOLED 2X', 'Chip': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Bộ nhớ': '512GB', 'Camera': '200MP + 50MP + 12MP + 10MP', 'Pin': '5000mAh' },
    stock: 35, rating: 4.8, reviewCount: 189, isNew: true, isFeatured: true, discount: 14
  },
  {
    name: 'Xiaomi 14 Ultra 512GB',
    slug: 'xiaomi-14-ultra-512gb',
    description: 'Xiaomi 14 Ultra với hệ thống camera Leica chuyên nghiệp, cảm biến 1 inch, chip Snapdragon 8 Gen 3 mạnh mẽ.',
    price: 27990000,
    originalPrice: 31990000,
    images: ['/xiaomi-14-ultra-black-leica-camera-smartphone.jpg', '/xiaomi-14-ultra-black-leica-camera.jpg'],
    categorySlug: 'dien-thoai',
    brand: 'Xiaomi',
    specs: { 'Màn hình': '6.73 inch LTPO AMOLED', 'Chip': 'Snapdragon 8 Gen 3', 'RAM': '16GB', 'Bộ nhớ': '512GB', 'Camera': '50MP Leica x4', 'Pin': '5000mAh' },
    stock: 25, rating: 4.7, reviewCount: 98, isNew: true, discount: 12
  },
  {
    name: 'OPPO Find X7 Ultra 256GB',
    slug: 'oppo-find-x7-ultra-256gb',
    description: 'OPPO Find X7 Ultra với camera Hasselblad, thiết kế da cao cấp, hiệu năng flagship.',
    price: 24990000,
    originalPrice: 28990000,
    images: ['/oppo-find-x7-ultra-brown-leather-smartphone.jpg'],
    categorySlug: 'dien-thoai',
    brand: 'OPPO',
    specs: { 'Màn hình': '6.82 inch LTPO AMOLED', 'Chip': 'Snapdragon 8 Gen 3', 'RAM': '12GB', 'Bộ nhớ': '256GB', 'Camera': '50MP Hasselblad x4', 'Pin': '5000mAh' },
    stock: 20, rating: 4.6, reviewCount: 67, discount: 14
  },
  {
    name: 'ASUS ROG Phone 8 Pro 512GB',
    slug: 'asus-rog-phone-8-pro-512gb',
    description: 'ROG Phone 8 Pro - Gaming phone đỉnh cao với Snapdragon 8 Gen 3, màn hình 165Hz, tản nhiệt AeroActive Cooler.',
    price: 26990000,
    originalPrice: 29990000,
    images: ['/asus-rog-phone-8-pro-gaming-phone.jpg'],
    categorySlug: 'dien-thoai',
    brand: 'ASUS',
    specs: { 'Màn hình': '6.78 inch LTPO AMOLED 165Hz', 'Chip': 'Snapdragon 8 Gen 3', 'RAM': '16GB', 'Bộ nhớ': '512GB', 'Camera': '50MP + 32MP + 13MP', 'Pin': '5500mAh' },
    stock: 15, rating: 4.8, reviewCount: 45, isNew: true, isFeatured: true, discount: 10
  },

  // Laptop
  {
    name: 'MacBook Pro 14" M3 Pro',
    slug: 'macbook-pro-14-m3-pro',
    description: 'MacBook Pro 14 inch với chip M3 Pro 11-core CPU, 14-core GPU. Màn hình Liquid Retina XDR, pin 17 giờ, hiệu năng vượt trội cho công việc chuyên nghiệp.',
    price: 49990000,
    originalPrice: 54990000,
    images: ['/macbook-pro-14-inch-space-gray.jpg'],
    categorySlug: 'laptop',
    brand: 'Apple',
    specs: { 'Màn hình': '14.2 inch Liquid Retina XDR', 'Chip': 'M3 Pro 11-core', 'RAM': '18GB', 'SSD': '512GB', 'GPU': '14-core', 'Pin': '17 giờ' },
    stock: 20, rating: 4.9, reviewCount: 156, isFeatured: true, discount: 9
  },
  {
    name: 'Dell XPS 15 OLED',
    slug: 'dell-xps-15-oled',
    description: 'Dell XPS 15 với màn hình OLED 3.5K tuyệt đẹp, Intel Core i7-13700H, RTX 4060. Thiết kế premium, bàn phím thoải mái.',
    price: 45990000,
    originalPrice: 52990000,
    images: ['/dell-xps-15-oled-silver-laptop.jpg', '/dell-xps-15-oled-silver-premium-laptop.jpg'],
    categorySlug: 'laptop',
    brand: 'Dell',
    specs: { 'Màn hình': '15.6 inch OLED 3.5K', 'CPU': 'Intel Core i7-13700H', 'RAM': '32GB DDR5', 'SSD': '1TB', 'GPU': 'RTX 4060 8GB', 'Pin': '86Wh' },
    stock: 15, rating: 4.7, reviewCount: 89, discount: 13
  },
  {
    name: 'ASUS ROG Strix G16 Gaming',
    slug: 'asus-rog-strix-g16-gaming',
    description: 'ROG Strix G16 - Laptop gaming với Intel Core i9-13980HX, RTX 4070, màn hình 240Hz. RGB Aura Sync, tản nhiệt ROG Intelligent Cooling.',
    price: 52990000,
    originalPrice: 59990000,
    images: ['/asus-rog-strix-g16-gaming-laptop-rgb.jpg'],
    categorySlug: 'laptop',
    brand: 'ASUS',
    specs: { 'Màn hình': '16 inch QHD+ 240Hz', 'CPU': 'Intel Core i9-13980HX', 'RAM': '32GB DDR5', 'SSD': '1TB', 'GPU': 'RTX 4070 8GB', 'Pin': '90Wh' },
    stock: 12, rating: 4.8, reviewCount: 67, isNew: true, isFeatured: true, discount: 12
  },
  {
    name: 'Lenovo ThinkPad X1 Carbon Gen 11',
    slug: 'lenovo-thinkpad-x1-carbon-gen-11',
    description: 'ThinkPad X1 Carbon - Laptop doanh nhân cao cấp, siêu nhẹ 1.12kg, Intel Core i7 vPro, bảo mật doanh nghiệp.',
    price: 42990000,
    originalPrice: 47990000,
    images: ['/lenovo-thinkpad-x1-carbon-black-business-laptop.jpg'],
    categorySlug: 'laptop',
    brand: 'Lenovo',
    specs: { 'Màn hình': '14 inch 2.8K OLED', 'CPU': 'Intel Core i7-1365U vPro', 'RAM': '32GB', 'SSD': '1TB', 'Trọng lượng': '1.12kg', 'Pin': '57Wh' },
    stock: 18, rating: 4.6, reviewCount: 54, discount: 10
  },

  // Tablet
  {
    name: 'iPad Pro M4 11" 256GB',
    slug: 'ipad-pro-m4-11-256gb',
    description: 'iPad Pro với chip M4 mới nhất, màn hình Ultra Retina XDR tandem OLED siêu mỏng. Hỗ trợ Apple Pencil Pro và Magic Keyboard.',
    price: 25990000,
    originalPrice: 28990000,
    images: ['/ipad-pro-m4-11-inch-silver-tablet.jpg', '/ipad-pro-m4-11-inch-silver.jpg'],
    categorySlug: 'tablet',
    brand: 'Apple',
    specs: { 'Màn hình': '11 inch Ultra Retina XDR OLED', 'Chip': 'M4', 'RAM': '8GB', 'Bộ nhớ': '256GB', 'Camera': '12MP Wide + 10MP Ultra Wide', 'Pin': '10 giờ' },
    stock: 30, rating: 4.8, reviewCount: 89, isNew: true, discount: 10
  },
  {
    name: 'Samsung Galaxy Tab S9 Ultra',
    slug: 'samsung-galaxy-tab-s9-ultra',
    description: 'Galaxy Tab S9 Ultra với màn hình Dynamic AMOLED 2X 14.6 inch khổng lồ, S Pen đi kèm, IP68 chống nước.',
    price: 28990000,
    originalPrice: 32990000,
    images: ['/samsung-galaxy-tab-s9-ultra-graphite-tablet.jpg', '/samsung-galaxy-tab-s9-ultra-graphite.jpg'],
    categorySlug: 'tablet',
    brand: 'Samsung',
    specs: { 'Màn hình': '14.6 inch Dynamic AMOLED 2X', 'Chip': 'Snapdragon 8 Gen 2', 'RAM': '12GB', 'Bộ nhớ': '256GB', 'Camera': '13MP + 8MP', 'Pin': '11200mAh' },
    stock: 22, rating: 4.7, reviewCount: 56, discount: 12
  },

  // PC & Gaming
  {
    name: 'PC Gaming T1next Ryzen 7 RTX 4070',
    slug: 'pc-gaming-t1next-ryzen-7-rtx-4070',
    description: 'PC Gaming cấu hình mạnh mẽ với Ryzen 7 7800X3D - CPU gaming tốt nhất, RTX 4070 Super 12GB, case kính cường lực RGB.',
    price: 35990000,
    originalPrice: 39990000,
    images: ['/gaming-pc-rgb-glass-case-rtx-4070.jpg'],
    categorySlug: 'pc-gaming',
    brand: 'T1next',
    specs: { 'CPU': 'AMD Ryzen 7 7800X3D', 'GPU': 'RTX 4070 Super 12GB', 'RAM': '32GB DDR5 6000MHz', 'SSD': '1TB NVMe Gen4', 'PSU': '750W 80+ Gold', 'Case': 'RGB Glass' },
    stock: 10, rating: 4.9, reviewCount: 45, isNew: true, isFeatured: true, discount: 10
  },
  {
    name: 'PC Gaming T1next RTX 4080 White',
    slug: 'pc-gaming-t1next-rtx-4080-white',
    description: 'PC Gaming cao cấp full white với RTX 4080 Super, Intel Core i7-14700K, thiết kế tản nhiệt nước custom loop.',
    price: 65990000,
    originalPrice: 72990000,
    images: ['/high-end-gaming-pc-rtx-4080-white-case-rgb.jpg'],
    categorySlug: 'pc-gaming',
    brand: 'T1next',
    specs: { 'CPU': 'Intel Core i7-14700K', 'GPU': 'RTX 4080 Super 16GB', 'RAM': '64GB DDR5 7200MHz', 'SSD': '2TB NVMe Gen4', 'Cooling': 'Custom Water Loop', 'Case': 'White RGB' },
    stock: 5, rating: 5.0, reviewCount: 23, isNew: true, isFeatured: true, discount: 10
  },
  {
    name: 'Mac Mini M2 Pro',
    slug: 'mac-mini-m2-pro',
    description: 'Mac Mini với chip M2 Pro mạnh mẽ, thiết kế nhỏ gọn, hiệu năng workstation trong form factor mini.',
    price: 32990000,
    originalPrice: 36990000,
    images: ['/mac-mini-m2-pro-silver-compact-desktop.jpg'],
    categorySlug: 'pc-gaming',
    brand: 'Apple',
    specs: { 'Chip': 'M2 Pro 10-core CPU', 'GPU': '16-core', 'RAM': '16GB', 'SSD': '512GB', 'Cổng': 'Thunderbolt 4 x4, HDMI, USB-A x2', 'Kích thước': '19.7 x 19.7 x 3.58 cm' },
    stock: 25, rating: 4.8, reviewCount: 78, discount: 11
  },

  // Màn hình
  {
    name: 'LG UltraGear 27" 4K Gaming',
    slug: 'lg-ultragear-27-4k-gaming',
    description: 'Màn hình gaming 27 inch 4K 144Hz, Nano IPS, 1ms GTG, HDMI 2.1 cho console next-gen, G-Sync Compatible.',
    price: 15990000,
    originalPrice: 18990000,
    images: ['/lg-ultragear-27-inch-4k-gaming-monitor.jpg'],
    categorySlug: 'man-hinh',
    brand: 'LG',
    specs: { 'Kích thước': '27 inch', 'Độ phân giải': '4K UHD 3840x2160', 'Tần số': '144Hz', 'Panel': 'Nano IPS', 'Thời gian phản hồi': '1ms GTG', 'HDR': 'HDR600' },
    stock: 30, rating: 4.7, reviewCount: 112, discount: 16
  },
  {
    name: 'Samsung Odyssey G9 49" OLED',
    slug: 'samsung-odyssey-g9-49-oled',
    description: 'Màn hình gaming cong 49 inch OLED, 240Hz, độ cong 1800R, tỷ lệ 32:9 siêu rộng cho trải nghiệm immersive.',
    price: 45990000,
    originalPrice: 52990000,
    images: ['/samsung-odyssey-g9-49-inch-curved-oled-gaming-moni.jpg'],
    categorySlug: 'man-hinh',
    brand: 'Samsung',
    specs: { 'Kích thước': '49 inch', 'Độ phân giải': 'DQHD 5120x1440', 'Tần số': '240Hz', 'Panel': 'QD-OLED', 'Độ cong': '1800R', 'HDR': 'HDR True Black 400' },
    stock: 8, rating: 4.9, reviewCount: 34, isNew: true, isFeatured: true, discount: 13
  },

  // Phụ kiện
  {
    name: 'AirPods Pro 2 USB-C',
    slug: 'airpods-pro-2-usb-c',
    description: 'AirPods Pro thế hệ 2 với cổng USB-C, chip H2, chống ồn chủ động 2x, Adaptive Audio, Conversation Awareness.',
    price: 5990000,
    originalPrice: 6990000,
    images: ['/airpods-pro-2-usb-c-white.jpg'],
    categorySlug: 'phu-kien',
    brand: 'Apple',
    specs: { 'Chip': 'H2', 'ANC': 'Active Noise Cancellation 2x', 'Pin tai nghe': '6 giờ', 'Pin case': '30 giờ', 'Chống nước': 'IP54', 'Sạc': 'USB-C, MagSafe, Qi' },
    stock: 100, rating: 4.8, reviewCount: 456, discount: 14
  },
  {
    name: 'Sony WH-1000XM5',
    slug: 'sony-wh-1000xm5',
    description: 'Tai nghe chống ồn hàng đầu thế giới với 8 microphone, chip V1, pin 30 giờ, thiết kế gập gọn mới.',
    price: 7990000,
    originalPrice: 8990000,
    images: ['/sony-wh-1000xm5-black-headphones.jpg'],
    categorySlug: 'phu-kien',
    brand: 'Sony',
    specs: { 'Driver': '30mm', 'ANC': '8 microphones', 'Pin': '30 giờ', 'Sạc nhanh': '3 phút = 3 giờ', 'Codec': 'LDAC, AAC, SBC', 'Trọng lượng': '250g' },
    stock: 60, rating: 4.9, reviewCount: 234, isFeatured: true, discount: 11
  },
  {
    name: 'Samsung Galaxy Buds3 Pro',
    slug: 'samsung-galaxy-buds3-pro',
    description: 'Tai nghe true wireless với thiết kế mới, ANC thông minh, âm thanh 360 Audio, Galaxy AI.',
    price: 4990000,
    originalPrice: 5490000,
    images: ['/samsung-galaxy-buds3-pro-silver.jpg'],
    categorySlug: 'phu-kien',
    brand: 'Samsung',
    specs: { 'Driver': '10.5mm + 6.1mm', 'ANC': 'Intelligent ANC', 'Pin tai nghe': '7 giờ', 'Pin case': '30 giờ', 'Chống nước': 'IP57', 'Codec': 'SSC, AAC, SBC' },
    stock: 80, rating: 4.6, reviewCount: 89, isNew: true, discount: 9
  },

  // Đồng hồ thông minh
  {
    name: 'Apple Watch Series 9 45mm',
    slug: 'apple-watch-series-9-45mm',
    description: 'Apple Watch Series 9 với chip S9 SiP, Double Tap gesture mới, màn hình sáng 2000 nits, carbon neutral.',
    price: 11990000,
    originalPrice: 12990000,
    images: ['/apple-watch-series-9-45mm-midnight.jpg'],
    categorySlug: 'dong-ho',
    brand: 'Apple',
    specs: { 'Màn hình': '45mm LTPO OLED', 'Chip': 'S9 SiP', 'Độ sáng': '2000 nits', 'Chống nước': '50m', 'Pin': '18 giờ', 'Tính năng': 'Double Tap, Crash Detection' },
    stock: 45, rating: 4.8, reviewCount: 167, isNew: true, discount: 8
  },

  // Chuột gaming
  {
    name: 'Logitech G Pro X Superlight 2',
    slug: 'logitech-g-pro-x-superlight-2',
    description: 'Chuột gaming không dây siêu nhẹ chỉ 60g, cảm biến HERO 2 32K DPI, pin 95 giờ, thiết kế đối xứng cho cả thuận tay trái.',
    price: 3290000,
    originalPrice: 3690000,
    images: ['/logitech-g-pro-x-superlight-white-gaming-mouse.jpg'],
    categorySlug: 'phu-kien',
    brand: 'Logitech',
    specs: { 'Cảm biến': 'HERO 2 32K DPI', 'Trọng lượng': '60g', 'Pin': '95 giờ', 'Kết nối': 'LIGHTSPEED Wireless', 'Polling rate': '2000Hz', 'Số nút': '5' },
    stock: 50, rating: 4.9, reviewCount: 234, isNew: true, isFeatured: true, discount: 11
  },
  {
    name: 'Razer DeathAdder V3 Pro',
    slug: 'razer-deathadder-v3-pro',
    description: 'Chuột gaming ergonomic không dây với cảm biến Focus Pro 30K, switch quang học Gen-3, trọng lượng 63g.',
    price: 3490000,
    originalPrice: 3990000,
    images: ['/razer-deathadder-v3-pro-black-gaming-mouse.jpg'],
    categorySlug: 'phu-kien',
    brand: 'Razer',
    specs: { 'Cảm biến': 'Focus Pro 30K DPI', 'Trọng lượng': '63g', 'Pin': '90 giờ', 'Kết nối': 'HyperSpeed Wireless', 'Switch': 'Optical Gen-3', 'Số nút': '5' },
    stock: 40, rating: 4.8, reviewCount: 189, discount: 13
  },

  // Bàn phím cơ
  {
    name: 'Keychron Q1 Pro',
    slug: 'keychron-q1-pro',
    description: 'Bàn phím cơ custom 75% với vỏ nhôm CNC, gasket mount, QMK/VIA, kết nối 3 chế độ Bluetooth/2.4GHz/USB-C.',
    price: 4590000,
    originalPrice: 4990000,
    images: ['/keychron-q1-pro-mechanical-keyboard-rgb.jpg'],
    categorySlug: 'phu-kien',
    brand: 'Keychron',
    specs: { 'Layout': '75% (84 phím)', 'Switch': 'Gateron Jupiter Brown', 'Kết nối': 'Bluetooth 5.1 / 2.4GHz / USB-C', 'Pin': '4000mAh', 'Vỏ': 'Nhôm CNC', 'Hot-swap': 'Có' },
    stock: 35, rating: 4.9, reviewCount: 156, isNew: true, isFeatured: true, discount: 8
  },
  {
    name: 'Logitech G915 TKL',
    slug: 'logitech-g915-tkl',
    description: 'Bàn phím cơ gaming không dây siêu mỏng, switch GL Tactile, LIGHTSYNC RGB, pin 40 giờ.',
    price: 4990000,
    originalPrice: 5490000,
    images: ['/logitech-g915-tkl-wireless-mechanical-keyboard.jpg'],
    categorySlug: 'phu-kien',
    brand: 'Logitech',
    specs: { 'Layout': 'TKL (87 phím)', 'Switch': 'GL Tactile', 'Kết nối': 'LIGHTSPEED / Bluetooth / USB', 'Pin': '40 giờ', 'RGB': 'LIGHTSYNC RGB', 'Chiều cao': '22mm' },
    stock: 25, rating: 4.7, reviewCount: 123, discount: 9
  },
]

// ==================== USERS ====================
const users = [
  { email: 'admin@t1next.com', password: 'admin123', name: 'Admin T1next', phone: '0909999999', address: 'T1next HQ, Quận 1, TP.HCM', role: 'admin' as const, avatar: '/avatar-male-user.jpg' },
  { email: 'sales@t1next.com', password: 'sales123', name: 'Trần Văn Bán', phone: '0908888888', address: 'T1next Store, Quận 3, TP.HCM', role: 'sales' as const, avatar: '/avatar-male-user.jpg' },
  { email: 'warehouse@t1next.com', password: 'warehouse123', name: 'Lê Thị Kho', phone: '0907777777', address: 'T1next Warehouse, Quận 7, TP.HCM', role: 'warehouse' as const, avatar: '/avatar-female-user.jpg' },
  { email: 'user@example.com', password: 'password123', name: 'Nguyễn Văn A', phone: '0901234567', address: '123 Đường ABC, Quận 1, TP.HCM', role: 'user' as const, avatar: '/avatar-male-user.jpg', points: 1500, tier: 'silver', totalSpent: 45000000, orderCount: 5 },
  { email: 'user2@example.com', password: 'password123', name: 'Trần Thị B', phone: '0912345678', address: '456 Đường XYZ, Quận 2, TP.HCM', role: 'user' as const, avatar: '/avatar-female-user.jpg', points: 500, tier: 'bronze', totalSpent: 15000000, orderCount: 2 },
  { email: 'user3@example.com', password: 'password123', name: 'Phạm Văn C', phone: '0923456789', address: '789 Đường DEF, Quận 3, TP.HCM', role: 'user' as const, avatar: '/avatar-male-user.jpg', points: 5000, tier: 'gold', totalSpent: 150000000, orderCount: 15 },
]


// ==================== MAIN SEED FUNCTION ====================
async function main() {
  console.log('🌱 Seeding database with comprehensive sample data...')

  // Clear existing data in correct order (respect foreign keys)
  console.log('🗑️  Clearing existing data...')
  await prisma.chatMessage.deleteMany()
  await prisma.chatSession.deleteMany()
  await prisma.pushSubscription.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.wishlist.deleteMany()
  await prisma.reviewImage.deleteMany()
  await prisma.review.deleteMany()
  await prisma.stockTransaction.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.cartItem.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.pendingRegistration.deleteMany()
  await prisma.user.deleteMany()

  // ==================== SEED CATEGORIES ====================
  console.log('📁 Seeding categories...')
  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.category.create({ data: cat })
    categoryMap[cat.slug] = created.id
  }
  console.log(`   ✅ ${categories.length} categories created`)

  // ==================== SEED PRODUCTS ====================
  console.log('📦 Seeding products...')
  const productMap: Record<string, string> = {}
  for (const p of products) {
    const { categorySlug, ...productData } = p
    const created = await prisma.product.create({
      data: {
        ...productData,
        categoryId: categoryMap[categorySlug],
      },
    })
    productMap[p.slug] = created.id
  }
  console.log(`   ✅ ${products.length} products created`)

  // ==================== SEED USERS ====================
  console.log('👥 Seeding users...')
  const userMap: Record<string, string> = {}
  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10)
    const created = await prisma.user.create({
      data: {
        email: u.email,
        password: hashedPassword,
        name: u.name,
        phone: u.phone,
        address: u.address,
        role: u.role,
        avatar: u.avatar,
        points: u.points || 0,
        tier: u.tier || 'bronze',
        totalSpent: u.totalSpent || 0,
        orderCount: u.orderCount || 0,
      },
    })
    userMap[u.email] = created.id
  }
  console.log(`   ✅ ${users.length} users created`)

  // ==================== SEED REVIEWS ====================
  console.log('⭐ Seeding reviews...')
  const reviews = [
    { userEmail: 'user@example.com', productSlug: 'iphone-15-pro-max-256gb', rating: 5, comment: 'Sản phẩm tuyệt vời! Camera chụp đẹp, pin trâu, hiệu năng mượt mà. Rất hài lòng với quyết định mua hàng.' },
    { userEmail: 'user2@example.com', productSlug: 'iphone-15-pro-max-256gb', rating: 5, comment: 'Đóng gói cẩn thận, giao hàng nhanh. iPhone xịn như mong đợi!' },
    { userEmail: 'user3@example.com', productSlug: 'iphone-15-pro-max-256gb', rating: 4, comment: 'Máy đẹp, chỉ tiếc là giá hơi cao. Nhưng chất lượng Apple thì không chê vào đâu được.' },
    { userEmail: 'user@example.com', productSlug: 'samsung-galaxy-s24-ultra-512gb', rating: 5, comment: 'Galaxy AI quá đỉnh! Tính năng Circle to Search rất tiện, camera 200MP chụp zoom xa vẫn nét.' },
    { userEmail: 'user2@example.com', productSlug: 'samsung-galaxy-s24-ultra-512gb', rating: 4, comment: 'S Pen tiện lợi cho công việc. Màn hình sáng, đẹp. Chỉ hơi nặng một chút.' },
    { userEmail: 'user@example.com', productSlug: 'macbook-pro-14-m3-pro', rating: 5, comment: 'Render video 4K mượt như bơ, pin dùng cả ngày không lo. Đáng đồng tiền bát gạo!' },
    { userEmail: 'user3@example.com', productSlug: 'macbook-pro-14-m3-pro', rating: 5, comment: 'Làm việc với Xcode, Final Cut Pro không hề giật lag. Màn hình XDR đẹp xuất sắc.' },
    { userEmail: 'user@example.com', productSlug: 'pc-gaming-t1next-ryzen-7-rtx-4070', rating: 5, comment: 'Chơi game 4K max setting vẫn mượt. Build đẹp, RGB lung linh. T1next support nhiệt tình!' },
    { userEmail: 'user2@example.com', productSlug: 'pc-gaming-t1next-ryzen-7-rtx-4070', rating: 5, comment: 'Giá hợp lý cho cấu hình này. Đóng gói kỹ, ship về không trầy xước gì.' },
    { userEmail: 'user@example.com', productSlug: 'airpods-pro-2-usb-c', rating: 5, comment: 'Chống ồn tốt, âm thanh hay. USB-C tiện hơn Lightning nhiều!' },
    { userEmail: 'user3@example.com', productSlug: 'sony-wh-1000xm5', rating: 5, comment: 'Tai nghe chống ồn tốt nhất mình từng dùng. Đeo cả ngày không đau tai.' },
    { userEmail: 'user@example.com', productSlug: 'ipad-pro-m4-11-256gb', rating: 5, comment: 'Mỏng nhẹ đáng kinh ngạc! Màn hình OLED đẹp, M4 mạnh mẽ cho mọi tác vụ.' },
    { userEmail: 'user2@example.com', productSlug: 'lg-ultragear-27-4k-gaming', rating: 4, comment: 'Màn hình đẹp, màu sắc chuẩn. Chơi game PS5 4K 120fps ngon lành.' },
    { userEmail: 'user@example.com', productSlug: 'apple-watch-series-9-45mm', rating: 5, comment: 'Double Tap rất tiện khi tay bận. Theo dõi sức khỏe chính xác.' },
    { userEmail: 'user3@example.com', productSlug: 'asus-rog-strix-g16-gaming', rating: 5, comment: 'Laptop gaming đỉnh cao! Chơi mọi game AAA max setting, tản nhiệt tốt.' },
    { userEmail: 'user@example.com', productSlug: 'logitech-g-pro-x-superlight-2', rating: 5, comment: 'Nhẹ như không cầm gì! Aim headshot dễ hơn hẳn, sensor cực kỳ chính xác.' },
    { userEmail: 'user3@example.com', productSlug: 'keychron-q1-pro', rating: 5, comment: 'Bàn phím custom chất lượng cao, gõ đã tay. Kết nối 3 mode rất tiện.' },
  ]

  for (const r of reviews) {
    await prisma.review.create({
      data: {
        userId: userMap[r.userEmail],
        productId: productMap[r.productSlug],
        rating: r.rating,
        comment: r.comment,
      },
    })
  }
  console.log(`   ✅ ${reviews.length} reviews created`)

  // ==================== SEED ORDERS ====================
  console.log('🛒 Seeding orders...')
  const orders = [
    {
      userEmail: 'user@example.com',
      total: 35980000,
      status: 'delivered' as const,
      shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
      paymentMethod: 'bank_transfer',
      recipientName: 'Nguyễn Văn A',
      phone: '0901234567',
      items: [
        { productSlug: 'iphone-15-pro-max-256gb', quantity: 1, price: 29990000 },
        { productSlug: 'airpods-pro-2-usb-c', quantity: 1, price: 5990000 },
      ],
    },
    {
      userEmail: 'user@example.com',
      total: 49990000,
      status: 'delivered' as const,
      shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
      paymentMethod: 'cod',
      recipientName: 'Nguyễn Văn A',
      phone: '0901234567',
      items: [
        { productSlug: 'macbook-pro-14-m3-pro', quantity: 1, price: 49990000 },
      ],
    },
    {
      userEmail: 'user2@example.com',
      total: 31990000,
      status: 'shipping' as const,
      shippingAddress: '456 Đường XYZ, Quận 2, TP.HCM',
      paymentMethod: 'bank_transfer',
      recipientName: 'Trần Thị B',
      phone: '0912345678',
      items: [
        { productSlug: 'samsung-galaxy-s24-ultra-512gb', quantity: 1, price: 31990000 },
      ],
    },
    {
      userEmail: 'user3@example.com',
      total: 65990000,
      status: 'confirmed' as const,
      shippingAddress: '789 Đường DEF, Quận 3, TP.HCM',
      paymentMethod: 'bank_transfer',
      recipientName: 'Phạm Văn C',
      phone: '0923456789',
      items: [
        { productSlug: 'pc-gaming-t1next-rtx-4080-white', quantity: 1, price: 65990000 },
      ],
    },
    {
      userEmail: 'user3@example.com',
      total: 53980000,
      status: 'delivered' as const,
      shippingAddress: '789 Đường DEF, Quận 3, TP.HCM',
      paymentMethod: 'cod',
      recipientName: 'Phạm Văn C',
      phone: '0923456789',
      items: [
        { productSlug: 'asus-rog-strix-g16-gaming', quantity: 1, price: 52990000 },
        { productSlug: 'samsung-galaxy-buds3-pro', quantity: 1, price: 4990000 },
      ],
      discountAmount: 4000000,
    },
    {
      userEmail: 'user@example.com',
      total: 25990000,
      status: 'pending' as const,
      shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
      paymentMethod: 'bank_transfer',
      recipientName: 'Nguyễn Văn A',
      phone: '0901234567',
      items: [
        { productSlug: 'ipad-pro-m4-11-256gb', quantity: 1, price: 25990000 },
      ],
    },
  ]

  for (const o of orders) {
    const order = await prisma.order.create({
      data: {
        userId: userMap[o.userEmail],
        total: o.total,
        discountAmount: o.discountAmount || 0,
        status: o.status,
        shippingAddress: o.shippingAddress,
        paymentMethod: o.paymentMethod,
        recipientName: o.recipientName,
        phone: o.phone,
      },
    })

    for (const item of o.items) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: productMap[item.productSlug],
          quantity: item.quantity,
          price: item.price,
        },
      })
    }
  }
  console.log(`   ✅ ${orders.length} orders created`)

  // ==================== SEED CART ITEMS ====================
  console.log('🛍️  Seeding cart items...')
  const cartItems = [
    { userEmail: 'user@example.com', productSlug: 'sony-wh-1000xm5', quantity: 1 },
    { userEmail: 'user@example.com', productSlug: 'apple-watch-series-9-45mm', quantity: 1 },
    { userEmail: 'user2@example.com', productSlug: 'xiaomi-14-ultra-512gb', quantity: 1 },
    { userEmail: 'user3@example.com', productSlug: 'samsung-odyssey-g9-49-oled', quantity: 1 },
    { userEmail: 'user3@example.com', productSlug: 'lg-ultragear-27-4k-gaming', quantity: 2 },
  ]

  for (const c of cartItems) {
    await prisma.cartItem.create({
      data: {
        userId: userMap[c.userEmail],
        productId: productMap[c.productSlug],
        quantity: c.quantity,
      },
    })
  }
  console.log(`   ✅ ${cartItems.length} cart items created`)

  // ==================== SEED WISHLIST ====================
  console.log('❤️  Seeding wishlist...')
  const wishlistItems = [
    { userEmail: 'user@example.com', productSlug: 'pc-gaming-t1next-rtx-4080-white' },
    { userEmail: 'user@example.com', productSlug: 'samsung-odyssey-g9-49-oled' },
    { userEmail: 'user2@example.com', productSlug: 'macbook-pro-14-m3-pro' },
    { userEmail: 'user2@example.com', productSlug: 'iphone-15-pro-max-256gb' },
    { userEmail: 'user3@example.com', productSlug: 'dell-xps-15-oled' },
    { userEmail: 'user3@example.com', productSlug: 'airpods-pro-2-usb-c' },
  ]

  for (const w of wishlistItems) {
    await prisma.wishlist.create({
      data: {
        userId: userMap[w.userEmail],
        productId: productMap[w.productSlug],
      },
    })
  }
  console.log(`   ✅ ${wishlistItems.length} wishlist items created`)

  // ==================== SEED STOCK TRANSACTIONS ====================
  console.log('📊 Seeding stock transactions...')
  const stockTransactions = [
    { productSlug: 'iphone-15-pro-max-256gb', userEmail: 'warehouse@t1next.com', type: 'import' as const, quantity: 100, reason: 'Nhập hàng từ Apple Vietnam', reference: 'NK-2024-001', stockBefore: 0, stockAfter: 100 },
    { productSlug: 'iphone-15-pro-max-256gb', userEmail: 'warehouse@t1next.com', type: 'order' as const, quantity: -50, reason: 'Xuất theo đơn hàng', reference: 'XK-2024-001', stockBefore: 100, stockAfter: 50 },
    { productSlug: 'samsung-galaxy-s24-ultra-512gb', userEmail: 'warehouse@t1next.com', type: 'import' as const, quantity: 50, reason: 'Nhập hàng từ Samsung Vietnam', reference: 'NK-2024-002', stockBefore: 0, stockAfter: 50 },
    { productSlug: 'samsung-galaxy-s24-ultra-512gb', userEmail: 'warehouse@t1next.com', type: 'order' as const, quantity: -15, reason: 'Xuất theo đơn hàng', reference: 'XK-2024-002', stockBefore: 50, stockAfter: 35 },
    { productSlug: 'macbook-pro-14-m3-pro', userEmail: 'warehouse@t1next.com', type: 'import' as const, quantity: 30, reason: 'Nhập hàng từ Apple Vietnam', reference: 'NK-2024-003', stockBefore: 0, stockAfter: 30 },
    { productSlug: 'macbook-pro-14-m3-pro', userEmail: 'warehouse@t1next.com', type: 'order' as const, quantity: -10, reason: 'Xuất theo đơn hàng', reference: 'XK-2024-003', stockBefore: 30, stockAfter: 20 },
    { productSlug: 'pc-gaming-t1next-ryzen-7-rtx-4070', userEmail: 'warehouse@t1next.com', type: 'import' as const, quantity: 15, reason: 'Build PC tại xưởng', reference: 'NK-2024-004', stockBefore: 0, stockAfter: 15 },
    { productSlug: 'pc-gaming-t1next-ryzen-7-rtx-4070', userEmail: 'warehouse@t1next.com', type: 'order' as const, quantity: -5, reason: 'Xuất theo đơn hàng', reference: 'XK-2024-004', stockBefore: 15, stockAfter: 10 },
    { productSlug: 'airpods-pro-2-usb-c', userEmail: 'warehouse@t1next.com', type: 'import' as const, quantity: 200, reason: 'Nhập hàng từ Apple Vietnam', reference: 'NK-2024-005', stockBefore: 0, stockAfter: 200 },
    { productSlug: 'airpods-pro-2-usb-c', userEmail: 'warehouse@t1next.com', type: 'order' as const, quantity: -100, reason: 'Xuất theo đơn hàng', reference: 'XK-2024-005', stockBefore: 200, stockAfter: 100 },
  ]

  for (const st of stockTransactions) {
    await prisma.stockTransaction.create({
      data: {
        productId: productMap[st.productSlug],
        userId: userMap[st.userEmail],
        type: st.type,
        quantity: Math.abs(st.quantity),
        reason: st.reason,
        reference: st.reference,
        stockBefore: st.stockBefore,
        stockAfter: st.stockAfter,
      },
    })
  }
  console.log(`   ✅ ${stockTransactions.length} stock transactions created`)

  // ==================== SEED NOTIFICATIONS ====================
  console.log('🔔 Seeding notifications...')
  const notifications = [
    { userEmail: 'user@example.com', type: 'order', title: 'Đơn hàng đã giao thành công', message: 'Đơn hàng #ORD-001 của bạn đã được giao thành công. Cảm ơn bạn đã mua sắm tại T1next!', isRead: true },
    { userEmail: 'user@example.com', type: 'order', title: 'Đơn hàng đang chờ thanh toán', message: 'Đơn hàng #ORD-006 của bạn đang chờ thanh toán. Vui lòng thanh toán trong 24h.', isRead: false },
    { userEmail: 'user@example.com', type: 'promotion', title: 'Flash Sale cuối năm!', message: 'Giảm đến 30% cho tất cả sản phẩm Apple. Chỉ trong 24h!', isRead: false },
    { userEmail: 'user2@example.com', type: 'order', title: 'Đơn hàng đang vận chuyển', message: 'Đơn hàng #ORD-003 của bạn đang được vận chuyển. Dự kiến giao trong 2-3 ngày.', isRead: true },
    { userEmail: 'user3@example.com', type: 'loyalty', title: 'Chúc mừng! Bạn đã lên hạng Gold', message: 'Bạn đã tích lũy đủ điểm để lên hạng Gold. Hưởng ưu đãi giảm 10% cho mọi đơn hàng!', isRead: true },
    { userEmail: 'user3@example.com', type: 'order', title: 'Đơn hàng đã xác nhận', message: 'Đơn hàng #ORD-004 của bạn đã được xác nhận và đang chuẩn bị hàng.', isRead: false },
  ]

  for (const n of notifications) {
    await prisma.notification.create({
      data: {
        userId: userMap[n.userEmail],
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
      },
    })
  }
  console.log(`   ✅ ${notifications.length} notifications created`)

  // ==================== SUMMARY ====================
  console.log('\n🎉 Database seeded successfully!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('📊 Summary:')
  console.log(`   • Categories: ${categories.length}`)
  console.log(`   • Products: ${products.length}`)
  console.log(`   • Users: ${users.length}`)
  console.log(`   • Reviews: ${reviews.length}`)
  console.log(`   • Orders: ${orders.length}`)
  console.log(`   • Cart Items: ${cartItems.length}`)
  console.log(`   • Wishlist Items: ${wishlistItems.length}`)
  console.log(`   • Stock Transactions: ${stockTransactions.length}`)
  console.log(`   • Notifications: ${notifications.length}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('\n👤 Test Accounts:')
  console.log('   Admin:     admin@t1next.com / admin123')
  console.log('   Sales:     sales@t1next.com / sales123')
  console.log('   Warehouse: warehouse@t1next.com / warehouse123')
  console.log('   User 1:    user@example.com / password123 (Silver)')
  console.log('   User 2:    user2@example.com / password123 (Bronze)')
  console.log('   User 3:    user3@example.com / password123 (Gold)')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
