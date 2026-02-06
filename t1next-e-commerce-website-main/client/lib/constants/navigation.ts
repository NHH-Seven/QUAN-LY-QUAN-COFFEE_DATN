/**
 * Navigation constants for header mega menu
 * Tách data ra khỏi component để dễ maintain
 */

/** Subcategories cho mega menu - mapping từ category slug */
export const SUBCATEGORIES: Record<string, { name: string; slug: string }[]> = {
  "ca-phe": [
    { name: "Cà phê đen", slug: "ca-phe-den" },
    { name: "Cà phê sữa", slug: "ca-phe-sua" },
    { name: "Espresso", slug: "espresso" },
    { name: "Cappuccino", slug: "cappuccino" },
    { name: "Latte", slug: "latte" },
    { name: "Cold Brew", slug: "cold-brew" },
  ],
  tra: [
    { name: "Trà đào", slug: "tra-dao" },
    { name: "Trà vải", slug: "tra-vai" },
    { name: "Trà sen", slug: "tra-sen" },
    { name: "Trà oolong", slug: "tra-oolong" },
    { name: "Trà matcha", slug: "tra-matcha" },
  ],
  "da-xay": [
    { name: "Chocolate đá xay", slug: "chocolate-da-xay" },
    { name: "Cookies & Cream", slug: "cookies-cream" },
    { name: "Caramel đá xay", slug: "caramel-da-xay" },
    { name: "Dâu đá xay", slug: "dau-da-xay" },
  ],
  "nuoc-ep-sinh-to": [
    { name: "Nước ép cam", slug: "nuoc-ep-cam" },
    { name: "Nước ép dưa hấu", slug: "nuoc-ep-dua-hau" },
    { name: "Sinh tố bơ", slug: "sinh-to-bo" },
    { name: "Sinh tố xoài", slug: "sinh-to-xoai" },
  ],
  "banh-ngot": [
    { name: "Tiramisu", slug: "tiramisu" },
    { name: "Cheesecake", slug: "cheesecake" },
    { name: "Croissant", slug: "croissant" },
    { name: "Mousse", slug: "mousse" },
  ],
  "ca-phe-hat": [
    { name: "Arabica", slug: "arabica" },
    { name: "Robusta", slug: "robusta" },
    { name: "Blend", slug: "blend" },
  ],
}

/** Thương hiệu/Xuất xứ nổi bật hiển thị trong mega menu */
export const FEATURED_BRANDS = [
  { name: "Đà Lạt", slug: "da-lat" },
  { name: "Buôn Ma Thuột", slug: "buon-ma-thuot" },
  { name: "Cầu Đất", slug: "cau-dat" },
  { name: "Sơn La", slug: "son-la" },
]

/** Hotline số điện thoại */
export const HOTLINE = "0762393111"
