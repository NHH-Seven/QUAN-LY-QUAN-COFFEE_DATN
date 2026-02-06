import { Server } from 'socket.io'

let io: Server | null = null

export function setSocketIO(socketIO: Server) {
  io = socketIO
}

export function getSocketIO(): Server | null {
  return io
}

// Emit order status change notification to user
export function notifyOrderStatusChange(userId: string, order: {
  id: string
  status: string
  total: number
}) {
  if (!io) return

  const statusLabels: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    shipping: 'Đang giao hàng',
    delivered: 'Đã giao hàng',
    cancelled: 'Đã hủy'
  }

  io.to(`user:${userId}`).emit('order:status_changed', {
    orderId: order.id,
    status: order.status,
    statusLabel: statusLabels[order.status] || order.status,
    total: order.total,
    timestamp: new Date().toISOString()
  })
}

// Emit new order notification to staff
export function notifyNewOrder(order: {
  id: string
  total: number
  recipientName: string
}) {
  if (!io) return

  io.to('staff').emit('order:new', {
    orderId: order.id,
    total: order.total,
    recipientName: order.recipientName,
    timestamp: new Date().toISOString()
  })
}

// Emit return request notification to staff
export function notifyNewReturn(returnRequest: {
  id: string
  orderId: string
  userName: string
}) {
  if (!io) return

  io.to('staff').emit('return:new', {
    returnId: returnRequest.id,
    orderId: returnRequest.orderId,
    userName: returnRequest.userName,
    timestamp: new Date().toISOString()
  })
}
