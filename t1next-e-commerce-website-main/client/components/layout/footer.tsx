import Link from "next/link"
import { Facebook, Instagram, Youtube, Phone, Mail, MapPin, Clock, Coffee } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const footerLinks = {
  menu: [
    { label: "Cà phê", href: "/category/ca-phe" },
    { label: "Trà", href: "/category/tra" },
    { label: "Đá xay", href: "/category/da-xay" },
    { label: "Bánh ngọt", href: "/category/banh-ngot" },
    { label: "Combo", href: "/category/combo" },
  ],
  about: [
    { label: "Giới thiệu", href: "/about" },
    { label: "Tin tức", href: "/news" },
    { label: "Tuyển dụng", href: "/careers" },
    { label: "Liên hệ", href: "/contact" },
  ],
  support: [
    { label: "Hướng dẫn đặt hàng", href: "/guide" },
    { label: "Chính sách giao hàng", href: "/shipping" },
    { label: "Chính sách đổi trả", href: "/returns" },
    { label: "Điều khoản sử dụng", href: "/terms" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white">
      {/* Newsletter Section */}
      <div className="bg-primary">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-bold text-primary-foreground">Đăng ký nhận tin</h3>
              <p className="mt-1 text-primary-foreground/80">Nhận ưu đãi và khuyến mãi mới nhất từ NHH-Coffee</p>
            </div>
            <div className="flex w-full max-w-md gap-2">
              <Input 
                type="email" 
                placeholder="Nhập email của bạn" 
                className="bg-white/90 border-0 text-foreground placeholder:text-muted-foreground"
              />
              <Button variant="secondary" className="shrink-0 font-semibold">
                Đăng ký
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Coffee className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">NHH-Coffee</span>
            </Link>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed max-w-sm">
              Cửa hàng cà phê & trà chất lượng cao. Chuyên phục vụ các loại cà phê, trà, đá xay và bánh ngọt thơm ngon với giá cả hợp lý.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Phone className="h-4 w-4" />
                </div>
                <span>0762393111</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Mail className="h-4 w-4" />
                </div>
                <span>support@nhh-coffee.com</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <MapPin className="h-4 w-4" />
                </div>
                <span>Hải Thịnh, Tỉnh Ninh Bình</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-300">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
                  <Clock className="h-4 w-4" />
                </div>
                <span>7:00 - 22:00 (Thứ 2 - CN)</span>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Thực đơn</h3>
            <ul className="space-y-3">
              {footerLinks.menu.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* About */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Về chúng tôi</h3>
            <ul className="space-y-3">
              {footerLinks.about.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 font-semibold text-white">Hỗ trợ</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Social Links */}
        <div className="mt-10 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex gap-3">
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-primary"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-primary"
              >
                <Youtube className="h-5 w-5" />
              </a>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">Thanh toán:</span>
              <div className="flex gap-2">
                <div className="flex h-8 w-12 items-center justify-center rounded bg-white/10 text-xs font-medium">VISA</div>
                <div className="flex h-8 w-12 items-center justify-center rounded bg-white/10 text-xs font-medium">MC</div>
                <div className="flex h-8 w-12 items-center justify-center rounded bg-white/10 text-xs font-medium">Momo</div>
                <div className="flex h-8 w-12 items-center justify-center rounded bg-white/10 text-xs font-medium">COD</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-white/10 bg-black/20">
        <div className="container mx-auto px-4 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2025 NHH-Coffee. Tất cả quyền được bảo lưu.
          </p>
        </div>
      </div>
    </footer>
  )
}
