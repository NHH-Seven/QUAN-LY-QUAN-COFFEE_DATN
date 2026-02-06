/**
 * Export utilities for CSV/Excel download
 */

type ExportData = Record<string, string | number | boolean | null | undefined>

/**
 * Convert data array to CSV string
 */
export function toCSV(data: ExportData[], columns: { key: string; label: string }[]): string {
  if (data.length === 0) return ''
  
  // BOM for UTF-8 Excel compatibility
  const BOM = '\uFEFF'
  
  // Header row
  const header = columns.map(c => `"${c.label}"`).join(',')
  
  // Data rows
  const rows = data.map(row => 
    columns.map(c => {
      const value = row[c.key]
      if (value === null || value === undefined) return '""'
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`
      return `"${value}"`
    }).join(',')
  )
  
  return BOM + [header, ...rows].join('\n')
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV and download
 */
export function exportToCSV(
  data: ExportData[], 
  columns: { key: string; label: string }[], 
  filename: string
) {
  const csv = toCSV(data, columns)
  downloadCSV(csv, filename)
}

// Pre-defined column configs
export const orderColumns = [
  { key: 'id', label: 'Mã đơn' },
  { key: 'createdAt', label: 'Ngày tạo' },
  { key: 'customerName', label: 'Khách hàng' },
  { key: 'phone', label: 'SĐT' },
  { key: 'paymentMethod', label: 'Thanh toán' },
  { key: 'status', label: 'Trạng thái' },
  { key: 'discount', label: 'Giảm giá' },
  { key: 'total', label: 'Tổng tiền' },
]

export const productColumns = [
  { key: 'id', label: 'Mã SP' },
  { key: 'name', label: 'Tên sản phẩm' },
  { key: 'brand', label: 'Thương hiệu' },
  { key: 'category', label: 'Danh mục' },
  { key: 'price', label: 'Giá bán' },
  { key: 'stock', label: 'Tồn kho' },
  { key: 'sold', label: 'Đã bán' },
]

export const revenueColumns = [
  { key: 'date', label: 'Ngày' },
  { key: 'orders', label: 'Số đơn' },
  { key: 'items', label: 'Sản phẩm' },
  { key: 'revenue', label: 'Doanh thu' },
]

export const topProductColumns = [
  { key: 'rank', label: 'Hạng' },
  { key: 'name', label: 'Tên sản phẩm' },
  { key: 'totalQuantity', label: 'SL bán' },
  { key: 'orderCount', label: 'Số đơn' },
  { key: 'totalRevenue', label: 'Doanh thu' },
]

// Format helpers
export const formatters = {
  date: (d: string) => new Date(d).toLocaleDateString('vi-VN'),
  datetime: (d: string) => new Date(d).toLocaleString('vi-VN'),
  price: (p: number) => new Intl.NumberFormat('vi-VN').format(p),
  paymentMethod: (m: string) => {
    const map: Record<string, string> = { cash: 'Tiền mặt', card: 'Thẻ', transfer: 'Chuyển khoản', cod: 'COD' }
    return map[m] || m
  },
  status: (s: string) => {
    const map: Record<string, string> = { 
      pending: 'Chờ xử lý', confirmed: 'Đã xác nhận', 
      shipping: 'Đang giao', delivered: 'Hoàn thành', cancelled: 'Đã hủy' 
    }
    return map[s] || s
  }
}
