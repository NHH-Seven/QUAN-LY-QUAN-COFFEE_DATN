import { pool } from './index.js'
import bcrypt from 'bcryptjs'

// Danh mục sản phẩm cho cửa hàng cà phê NHH-Coffee
const categories = [
  { id: '1', name: 'Cà phê', slug: 'ca-phe', icon: 'coffee', product_count: 15 },
  { id: '2', name: 'Trà', slug: 'tra', icon: 'leaf', product_count: 12 },
  { id: '3', name: 'Đá xay', slug: 'da-xay', icon: 'snowflake', product_count: 8 },
  { id: '4', name: 'Nước ép & Sinh tố', slug: 'nuoc-ep-sinh-to', icon: 'citrus', product_count: 10 },
  { id: '5', name: 'Bánh ngọt', slug: 'banh-ngot', icon: 'cake', product_count: 12 },
  { id: '6', name: 'Snack & Đồ ăn nhẹ', slug: 'snack-do-an-nhe', icon: 'cookie', product_count: 8 },
  { id: '7', name: 'Combo', slug: 'combo', icon: 'package', product_count: 6 },
  { id: '8', name: 'Cà phê hạt', slug: 'ca-phe-hat', icon: 'bean', product_count: 10 },
]

// CÀ PHÊ
const products = [
  { id: '1', name: 'Cà phê đen đá', slug: 'ca-phe-den-da', description: 'Cà phê đen truyền thống pha phin, đậm đà hương vị Việt Nam. Hạt cà phê Robusta được rang xay tươi mỗi ngày, mang đến vị đắng đặc trưng và hậu ngọt thanh.', price: 25000, original_price: 30000, images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', 'Đường': 'Có thể điều chỉnh', 'Đá': 'Có thể điều chỉnh', 'Caffeine': 'Cao', '_sizes': ['M', 'L'], '_toppings': ['Thêm shot espresso', 'Sữa đặc'] }, stock: 999, rating: 4.8, review_count: 156, is_new: false, is_featured: true, discount: 17 },
  { id: '2', name: 'Cà phê sữa đá', slug: 'ca-phe-sua-da', description: 'Cà phê sữa đá - thức uống quốc dân của người Việt. Sự kết hợp hoàn hảo giữa cà phê đậm đà và sữa đặc béo ngậy, tạo nên hương vị khó quên.', price: 29000, original_price: 35000, images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', 'Đường': 'Có thể điều chỉnh', 'Đá': 'Có thể điều chỉnh', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.9, review_count: 234, is_new: false, is_featured: true, discount: 17 },
  { id: '3', name: 'Bạc xỉu', slug: 'bac-xiu', description: 'Bạc xỉu - cà phê sữa phiên bản nhẹ nhàng hơn, nhiều sữa hơn, phù hợp cho những ai thích vị ngọt béo và ít đắng.', price: 32000, original_price: 38000, images: ['https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.7, review_count: 189, is_new: false, is_featured: true, discount: 16 },
  { id: '4', name: 'Espresso', slug: 'espresso', description: 'Espresso nguyên chất, chiết xuất từ hạt Arabica cao cấp. Đậm đặc, thơm nồng với lớp crema vàng óng hoàn hảo.', price: 35000, original_price: 40000, images: ['https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Loại': 'Single/Double shot', '_sizes': ['Single', 'Double'] }, stock: 999, rating: 4.8, review_count: 98, is_new: false, is_featured: false, discount: 12 },
  { id: '5', name: 'Americano', slug: 'americano', description: 'Americano - espresso pha loãng với nước nóng, giữ nguyên hương vị cà phê nhưng nhẹ nhàng hơn. Thích hợp cho những ai yêu thích vị cà phê thuần túy.', price: 39000, original_price: 45000, images: ['https://images.unsplash.com/photo-1551030173-122aabc4489c?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', 'Nhiệt độ': 'Nóng/Đá', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.6, review_count: 87, is_new: false, is_featured: false, discount: 13 },
  { id: '6', name: 'Cappuccino', slug: 'cappuccino', description: 'Cappuccino chuẩn Ý với tỷ lệ hoàn hảo 1:1:1 giữa espresso, sữa nóng và bọt sữa mịn. Rắc bột cacao lên trên tạo điểm nhấn.', price: 45000, original_price: 52000, images: ['https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 145, is_new: false, is_featured: true, discount: 13 },
  { id: '7', name: 'Latte', slug: 'latte', description: 'Latte mềm mại với espresso và sữa tươi đánh bông. Vị cà phê nhẹ nhàng, béo ngậy, thích hợp cho buổi sáng thư thái.', price: 45000, original_price: 52000, images: ['https://images.unsplash.com/photo-1561882468-9110e03e0f78?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.7, review_count: 167, is_new: false, is_featured: false, discount: 13 },
  { id: '8', name: 'Mocha', slug: 'mocha', description: 'Mocha - sự kết hợp tuyệt vời giữa espresso, chocolate và sữa tươi. Vị đắng nhẹ của cà phê hòa quyện với vị ngọt của chocolate.', price: 49000, original_price: 55000, images: ['https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 134, is_new: false, is_featured: false, discount: 11 },
  { id: '9', name: 'Caramel Macchiato', slug: 'caramel-macchiato', description: 'Caramel Macchiato với lớp sữa tươi mịn màng, espresso đậm đà và sốt caramel thơm ngọt. Thức uống hoàn hảo cho những ai yêu thích vị ngọt.', price: 52000, original_price: 59000, images: ['https://images.unsplash.com/photo-1485808191679-5f86510681a2?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.9, review_count: 198, is_new: true, is_featured: true, discount: 12 },
  { id: '10', name: 'Cold Brew', slug: 'cold-brew', description: 'Cold Brew - cà phê ủ lạnh 18 tiếng, chiết xuất chậm để giữ trọn hương vị. Vị mượt mà, ít acid, thơm ngọt tự nhiên.', price: 45000, original_price: 52000, images: ['https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500'], category_id: '1', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 112, is_new: true, is_featured: true, discount: 13 },
]

// TRÀ
const products2 = [
  { id: '11', name: 'Trà đào cam sả', slug: 'tra-dao-cam-sa', description: 'Trà đào cam sả thanh mát với đào ngâm thơm ngọt, cam tươi và sả thơm. Thức uống giải khát hoàn hảo cho mùa hè.', price: 39000, original_price: 45000, images: ['https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500'], category_id: '2', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.9, review_count: 267, is_new: false, is_featured: true, discount: 13 },
  { id: '12', name: 'Trà vải', slug: 'tra-vai', description: 'Trà vải thơm ngọt với vải tươi ngâm, vị thanh mát dễ uống. Thức uống được yêu thích nhất mùa hè.', price: 39000, original_price: 45000, images: ['https://images.unsplash.com/photo-1558857563-b371033873b8?w=500'], category_id: '2', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 189, is_new: false, is_featured: true, discount: 13 },
  { id: '13', name: 'Trà sen vàng', slug: 'tra-sen-vang', description: 'Trà sen vàng với hương sen thanh tao, vị trà xanh nhẹ nhàng. Thức uống mang đậm hương vị Việt Nam.', price: 35000, original_price: 42000, images: ['https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500'], category_id: '2', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.7, review_count: 145, is_new: false, is_featured: false, discount: 17 },
  { id: '14', name: 'Trà oolong sữa', slug: 'tra-oolong-sua', description: 'Trà oolong sữa béo ngậy với trà oolong thượng hạng và sữa tươi. Vị trà đậm đà hòa quyện với sữa béo.', price: 42000, original_price: 49000, images: ['https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=500'], category_id: '2', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 156, is_new: false, is_featured: false, discount: 14 },
  { id: '15', name: 'Trà matcha đá xay', slug: 'tra-matcha-da-xay', description: 'Trà matcha Nhật Bản xay đá mịn, vị trà xanh đậm đà, thơm ngon. Topping kem whip béo ngậy.', price: 49000, original_price: 55000, images: ['https://images.unsplash.com/photo-1515823064-d6e0c04616a7?w=500'], category_id: '2', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.9, review_count: 178, is_new: true, is_featured: true, discount: 11 },
  { id: '16', name: 'Hồng trà', slug: 'hong-tra', description: 'Hồng trà Ceylon thượng hạng, vị trà đậm đà, hương thơm đặc trưng. Có thể thêm sữa hoặc chanh.', price: 29000, original_price: 35000, images: ['https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=500'], category_id: '2', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.6, review_count: 98, is_new: false, is_featured: false, discount: 17 },
  // ĐÁ XAY
  { id: '17', name: 'Chocolate đá xay', slug: 'chocolate-da-xay', description: 'Chocolate đá xay béo ngậy với bột cacao nguyên chất, sữa tươi và kem whip. Thức uống yêu thích của các bạn trẻ.', price: 49000, original_price: 55000, images: ['https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500'], category_id: '3', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 167, is_new: false, is_featured: true, discount: 11 },
  { id: '18', name: 'Cookies & Cream', slug: 'cookies-cream', description: 'Đá xay Cookies & Cream với bánh Oreo nghiền, kem vanilla và kem whip. Vị ngọt béo, giòn tan.', price: 52000, original_price: 59000, images: ['https://images.unsplash.com/photo-1577805947697-89e18249d767?w=500'], category_id: '3', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.9, review_count: 145, is_new: true, is_featured: true, discount: 12 },
  { id: '19', name: 'Dâu đá xay', slug: 'dau-da-xay', description: 'Dâu đá xay tươi mát với dâu tây tươi, sữa chua và đá xay. Vị chua ngọt hài hòa.', price: 45000, original_price: 52000, images: ['https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500'], category_id: '3', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.7, review_count: 123, is_new: false, is_featured: false, discount: 13 },
  { id: '20', name: 'Caramel đá xay', slug: 'caramel-da-xay', description: 'Caramel đá xay thơm ngọt với sốt caramel, sữa tươi và kem whip. Vị ngọt béo quyến rũ.', price: 49000, original_price: 55000, images: ['https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500'], category_id: '3', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 134, is_new: false, is_featured: false, discount: 11 },
]

// NƯỚC ÉP & SINH TỐ, BÁNH NGỌT, SNACK
const products3 = [
  { id: '21', name: 'Nước ép cam', slug: 'nuoc-ep-cam', description: 'Nước ép cam tươi 100% nguyên chất, không đường, giàu vitamin C. Tươi mát, bổ dưỡng.', price: 35000, original_price: 42000, images: ['https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=500'], category_id: '4', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.7, review_count: 89, is_new: false, is_featured: false, discount: 17 },
  { id: '22', name: 'Nước ép dưa hấu', slug: 'nuoc-ep-dua-hau', description: 'Nước ép dưa hấu tươi mát, ngọt tự nhiên. Giải khát tuyệt vời cho mùa hè.', price: 32000, original_price: 38000, images: ['https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500'], category_id: '4', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.6, review_count: 76, is_new: false, is_featured: false, discount: 16 },
  { id: '23', name: 'Sinh tố bơ', slug: 'sinh-to-bo', description: 'Sinh tố bơ béo ngậy với bơ sáp chín, sữa đặc và đá xay. Thức uống bổ dưỡng, thơm ngon.', price: 45000, original_price: 52000, images: ['https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=500'], category_id: '4', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.9, review_count: 156, is_new: false, is_featured: true, discount: 13 },
  { id: '24', name: 'Sinh tố xoài', slug: 'sinh-to-xoai', description: 'Sinh tố xoài thơm ngọt với xoài chín, sữa tươi và đá xay. Vị ngọt tự nhiên, mát lạnh.', price: 42000, original_price: 49000, images: ['https://images.unsplash.com/photo-1546173159-315724a31696?w=500'], category_id: '4', brand: 'NHH-Coffee', specs: { 'Kích cỡ': 'M/L', '_sizes': ['M', 'L'] }, stock: 999, rating: 4.8, review_count: 134, is_new: false, is_featured: false, discount: 14 },
  // BÁNH NGỌT
  { id: '25', name: 'Bánh tiramisu', slug: 'banh-tiramisu', description: 'Bánh tiramisu Ý chuẩn vị với lớp kem mascarpone mịn màng, bánh lady finger thấm cà phê espresso và rắc bột cacao.', price: 55000, original_price: 65000, images: ['https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500'], category_id: '5', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '1 miếng', 'Bảo quản': 'Ngăn mát tủ lạnh' }, stock: 50, rating: 4.9, review_count: 189, is_new: false, is_featured: true, discount: 15 },
  { id: '26', name: 'Bánh cheesecake', slug: 'banh-cheesecake', description: 'Bánh cheesecake New York style với lớp phô mai cream cheese béo ngậy, đế bánh quy giòn tan.', price: 52000, original_price: 60000, images: ['https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=500'], category_id: '5', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '1 miếng', 'Bảo quản': 'Ngăn mát tủ lạnh' }, stock: 40, rating: 4.8, review_count: 145, is_new: false, is_featured: true, discount: 13 },
  { id: '27', name: 'Croissant bơ', slug: 'croissant-bo', description: 'Croissant bơ Pháp với lớp vỏ giòn xốp, bên trong mềm mịn, thơm mùi bơ. Nướng tươi mỗi ngày.', price: 35000, original_price: 42000, images: ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500'], category_id: '5', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '1 cái', 'Bảo quản': 'Nhiệt độ phòng' }, stock: 60, rating: 4.7, review_count: 167, is_new: false, is_featured: false, discount: 17 },
  { id: '28', name: 'Bánh mì que pate', slug: 'banh-mi-que-pate', description: 'Bánh mì que giòn rụm với pate gan thơm béo, bơ và chút tiêu. Món ăn nhẹ hoàn hảo kèm cà phê.', price: 18000, original_price: 22000, images: ['https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500'], category_id: '5', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '1 cái' }, stock: 100, rating: 4.6, review_count: 234, is_new: false, is_featured: false, discount: 18 },
  { id: '29', name: 'Bánh mousse chocolate', slug: 'banh-mousse-chocolate', description: 'Bánh mousse chocolate đậm đà với lớp mousse mịn như nhung, chocolate Bỉ cao cấp.', price: 58000, original_price: 68000, images: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500'], category_id: '5', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '1 miếng', 'Bảo quản': 'Ngăn mát tủ lạnh' }, stock: 35, rating: 4.9, review_count: 123, is_new: true, is_featured: true, discount: 15 },
  // SNACK & ĐỒ ĂN NHẸ
  { id: '30', name: 'Khoai tây chiên', slug: 'khoai-tay-chien', description: 'Khoai tây chiên giòn rụm, vàng ươm. Ăn kèm sốt mayonnaise hoặc tương cà.', price: 35000, original_price: 42000, images: ['https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500'], category_id: '6', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '1 phần' }, stock: 80, rating: 4.5, review_count: 98, is_new: false, is_featured: false, discount: 17 },
  { id: '31', name: 'Gà viên chiên', slug: 'ga-vien-chien', description: 'Gà viên chiên giòn với thịt gà xay mịn, vỏ ngoài giòn tan. Ăn kèm sốt chua ngọt.', price: 42000, original_price: 49000, images: ['https://images.unsplash.com/photo-1562967914-608f82629710?w=500'], category_id: '6', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '6 viên' }, stock: 70, rating: 4.6, review_count: 87, is_new: false, is_featured: false, discount: 14 },
  { id: '32', name: 'Sandwich gà', slug: 'sandwich-ga', description: 'Sandwich gà với thịt gà xé, rau xà lách, cà chua và sốt mayonnaise. Bánh mì sandwich mềm mịn.', price: 45000, original_price: 52000, images: ['https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500'], category_id: '6', brand: 'NHH-Coffee', specs: { 'Khẩu phần': '1 cái' }, stock: 50, rating: 4.7, review_count: 112, is_new: false, is_featured: false, discount: 13 },
]

// COMBO & CÀ PHÊ HẠT
const products4 = [
  // COMBO
  { id: '33', name: 'Combo sáng 1', slug: 'combo-sang-1', description: 'Combo sáng tiết kiệm: 1 Cà phê sữa đá + 1 Croissant bơ. Bữa sáng hoàn hảo để bắt đầu ngày mới.', price: 55000, original_price: 71000, images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500'], category_id: '7', brand: 'NHH-Coffee', specs: { 'Bao gồm': 'Cà phê sữa đá + Croissant bơ' }, stock: 999, rating: 4.8, review_count: 145, is_new: false, is_featured: true, discount: 23 },
  { id: '34', name: 'Combo sáng 2', slug: 'combo-sang-2', description: 'Combo sáng đầy đủ: 1 Cappuccino + 1 Bánh tiramisu. Thưởng thức buổi sáng sang trọng.', price: 89000, original_price: 117000, images: ['https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500'], category_id: '7', brand: 'NHH-Coffee', specs: { 'Bao gồm': 'Cappuccino + Bánh tiramisu' }, stock: 999, rating: 4.9, review_count: 98, is_new: false, is_featured: true, discount: 24 },
  { id: '35', name: 'Combo đôi', slug: 'combo-doi', description: 'Combo cho 2 người: 2 Trà đào cam sả + 1 Bánh cheesecake. Thích hợp cho buổi hẹn hò.', price: 119000, original_price: 150000, images: ['https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=500'], category_id: '7', brand: 'NHH-Coffee', specs: { 'Bao gồm': '2 Trà đào cam sả + 1 Bánh cheesecake' }, stock: 999, rating: 4.8, review_count: 76, is_new: true, is_featured: true, discount: 21 },
  { id: '36', name: 'Combo nhóm', slug: 'combo-nhom', description: 'Combo cho nhóm 4 người: 4 đồ uống tự chọn (dưới 50k) + 1 Khoai tây chiên. Tiết kiệm khi đi nhóm.', price: 189000, original_price: 242000, images: ['https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=500'], category_id: '7', brand: 'NHH-Coffee', specs: { 'Bao gồm': '4 đồ uống + 1 Khoai tây chiên' }, stock: 999, rating: 4.7, review_count: 67, is_new: false, is_featured: false, discount: 22 },
  // CÀ PHÊ HẠT
  { id: '37', name: 'Cà phê hạt Arabica Đà Lạt', slug: 'ca-phe-hat-arabica-da-lat', description: 'Cà phê hạt Arabica Đà Lạt 100% nguyên chất. Hương thơm nhẹ nhàng, vị chua thanh đặc trưng, hậu ngọt dài. Rang medium roast.', price: 180000, original_price: 220000, images: ['https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=500'], category_id: '8', brand: 'NHH-Coffee', specs: { 'Trọng lượng': '250g', 'Xuất xứ': 'Đà Lạt, Lâm Đồng', 'Rang': 'Medium Roast', 'Độ cao': '1500m' }, stock: 100, rating: 4.9, review_count: 89, is_new: false, is_featured: true, discount: 18 },
  { id: '38', name: 'Cà phê hạt Robusta Buôn Ma Thuột', slug: 'ca-phe-hat-robusta-buon-ma-thuot', description: 'Cà phê hạt Robusta Buôn Ma Thuột đậm đà. Vị đắng mạnh, hương thơm nồng, caffeine cao. Rang dark roast truyền thống.', price: 150000, original_price: 180000, images: ['https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500'], category_id: '8', brand: 'NHH-Coffee', specs: { 'Trọng lượng': '250g', 'Xuất xứ': 'Buôn Ma Thuột, Đắk Lắk', 'Rang': 'Dark Roast' }, stock: 120, rating: 4.8, review_count: 156, is_new: false, is_featured: true, discount: 17 },
  { id: '39', name: 'Cà phê hạt Blend House', slug: 'ca-phe-hat-blend-house', description: 'Cà phê hạt Blend House đặc biệt của NHH-Coffee. Phối trộn Arabica và Robusta tỷ lệ vàng, cân bằng giữa hương thơm và vị đậm.', price: 165000, original_price: 200000, images: ['https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=500'], category_id: '8', brand: 'NHH-Coffee', specs: { 'Trọng lượng': '250g', 'Thành phần': '60% Arabica + 40% Robusta', 'Rang': 'Medium-Dark Roast' }, stock: 80, rating: 4.9, review_count: 134, is_new: true, is_featured: true, discount: 18 },
  { id: '40', name: 'Cà phê hạt Espresso Blend', slug: 'ca-phe-hat-espresso-blend', description: 'Cà phê hạt Espresso Blend chuyên dụng cho máy pha. Crema dày, vị đậm đà, hương thơm quyến rũ.', price: 195000, original_price: 240000, images: ['https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500'], category_id: '8', brand: 'NHH-Coffee', specs: { 'Trọng lượng': '250g', 'Thành phần': '70% Arabica + 30% Robusta', 'Rang': 'Dark Roast', 'Phù hợp': 'Máy pha espresso' }, stock: 60, rating: 4.8, review_count: 78, is_new: false, is_featured: false, discount: 19 },
]

const allProducts = [...products, ...products2, ...products3, ...products4]


async function seed() {
  try {
    console.log('🌱 Seeding database cho NHH-Coffee...')

    // Clear existing data
    await pool.query('TRUNCATE categories, products, users, cart_items, orders, order_items, reviews RESTART IDENTITY CASCADE')

    // Insert categories with fixed IDs
    for (const cat of categories) {
      await pool.query(
        `INSERT INTO categories (id, name, slug, icon, product_count) VALUES ($1, $2, $3, $4, $5)`,
        [cat.id, cat.name, cat.slug, cat.icon, cat.product_count]
      )
    }
    console.log('✅ Categories seeded')

    // Insert products with fixed IDs
    for (const p of allProducts) {
      await pool.query(
        `INSERT INTO products (id, name, slug, description, price, original_price, images, category_id, brand, specs, stock, rating, review_count, is_new, is_featured, discount)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [p.id, p.name, p.slug, p.description, p.price, p.original_price, p.images, p.category_id, p.brand, JSON.stringify(p.specs), p.stock, p.rating, p.review_count, p.is_new, p.is_featured, p.discount]
      )
    }
    console.log('✅ Products seeded (' + allProducts.length + ' sản phẩm)')

    // Insert demo users
    const users = [
      { id: '1', email: 'user@example.com', password: 'password123', name: 'Nguyễn Văn A', role: 'user', phone: '0901234567', address: '123 Đường ABC, Quận 1, TP.HCM' },
      { id: '2', email: 'admin@nhh-coffee.com', password: 'admin123', name: 'Admin NHH-Coffee', role: 'admin', phone: '0909999999', address: 'NHH-Coffee HQ' },
      { id: '3', email: 'staff@nhh-coffee.com', password: 'staff123', name: 'Nhân viên Bán hàng', role: 'sales', phone: '0908888888', address: 'NHH-Coffee Store' },
      { id: '4', email: 'warehouse@nhh-coffee.com', password: 'warehouse123', name: 'Nhân viên Kho', role: 'warehouse', phone: '0907777777', address: 'NHH-Coffee Warehouse' },
    ]

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10)
      await pool.query(
        `INSERT INTO users (id, email, password, name, role, phone, address, is_active) VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [user.id, user.email, hashedPassword, user.name, user.role, user.phone, user.address]
      )
    }
    console.log('✅ Demo users seeded:')
    console.log('   - user@example.com / password123 (user)')
    console.log('   - admin@nhh-coffee.com / admin123 (admin)')
    console.log('   - staff@nhh-coffee.com / staff123 (sales)')
    console.log('   - warehouse@nhh-coffee.com / warehouse123 (warehouse)')

    console.log('🎉 Database NHH-Coffee seeded successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

seed()
