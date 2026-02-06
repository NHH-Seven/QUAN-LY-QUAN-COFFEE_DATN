import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Đặt hàng thành công - NHH-Coffee",
  description: "Đơn hàng của bạn đã được đặt thành công tại NHH-Coffee",
}

export default function OrderSuccessLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
