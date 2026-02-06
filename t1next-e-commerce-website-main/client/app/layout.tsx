import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { CartProvider } from "@/contexts/cart-context"
import { AuthProvider } from "@/contexts/auth-context"
import { WishlistProvider } from "@/contexts/wishlist-context"
import { CompareProvider } from "@/contexts/compare-context"
import { ChatProvider } from "@/contexts/chat-context"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { CompareBarWrapper } from "@/components/product/compare-bar-wrapper"
import { UnifiedChatWidget } from "@/components/chatbot/unified-chat-widget"
import { NotificationListener } from "@/components/notifications/notification-listener"
import { AuthErrorHandler } from "@/components/auth-error-handler"
import "@/lib/clear-auth"

const inter = Inter({ subsets: ["latin", "vietnamese"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "NHH-Coffee - Cửa hàng cà phê & trà",
  description:
    "NHH-Coffee - Thưởng thức cà phê, trà và bánh ngọt chất lượng cao. Đặt hàng online, giao hàng nhanh chóng.",
  keywords: ["cà phê", "trà", "bánh ngọt", "coffee", "NHH-Coffee", "đồ uống"],
  generator: 'v0.app'
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <CompareProvider>
                  <ChatProvider>
                    {children}
                    <CompareBarWrapper />
                    <UnifiedChatWidget />
                    <NotificationListener />
                    <AuthErrorHandler />
                    <Toaster />
                  </ChatProvider>
                </CompareProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
