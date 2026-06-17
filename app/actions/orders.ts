'use server'

import { db } from '@/lib/db'
import {
  diningTables,
  orderItems,
  orders,
  transactions,
} from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export type OrderWithItems = {
  order: typeof orders.$inferSelect
  items: (typeof orderItems.$inferSelect)[]
}

function genOrderNo() {
  const d = new Date()
  const stamp = `${d.getHours().toString().padStart(2, '0')}${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}${d.getSeconds().toString().padStart(2, '0')}`
  return `SP-${stamp}`
}

export async function getOpenOrders() {
  const userId = await getUserId()
  const openOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'acik')))
    .orderBy(desc(orders.createdAt))

  if (openOrders.length === 0) return [] as OrderWithItems[]

  const items = await db
    .select()
    .from(orderItems)
    .where(
      and(
        eq(orderItems.userId, userId),
        inArray(
          orderItems.orderId,
          openOrders.map((o) => o.id),
        ),
      ),
    )

  return openOrders.map((order) => ({
    order,
    items: items.filter((i) => i.orderId === order.id),
  })) satisfies OrderWithItems[]
}

export async function getOrderWithItems(orderId: number): Promise<OrderWithItems | null> {
  const userId = await getUserId()
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  if (!order) return null
  const items = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), eq(orderItems.userId, userId)))
  return { order, items }
}

export async function createOrder(data: {
  type: string
  tableId?: number | null
  customerName?: string
  customerPhone?: string
  customerAddress?: string
}) {
  const userId = await getUserId()
  const [order] = await db
    .insert(orders)
    .values({
      userId,
      orderNo: genOrderNo(),
      type: data.type,
      tableId: data.tableId ?? null,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerAddress: data.customerAddress,
    })
    .returning()

  if (data.tableId) {
    await db
      .update(diningTables)
      .set({ status: 'dolu' })
      .where(and(eq(diningTables.id, data.tableId), eq(diningTables.userId, userId)))
  }
  revalidatePath('/pos')
  revalidatePath('/delivery')
  return order.id
}

async function recalcOrder(userId: string, orderId: number) {
  const items = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.orderId, orderId), eq(orderItems.userId, userId)))
  const subtotal = items.reduce((sum, i) => sum + Number(i.price) * i.quantity, 0)
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  const discount = order ? Number(order.discount) : 0
  await db
    .update(orders)
    .set({ subtotal: String(subtotal), total: String(Math.max(0, subtotal - discount)) })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
}

export async function addOrderItem(data: {
  orderId: number
  menuItemId: number
  name: string
  price: number
  quantity?: number
  note?: string
}) {
  const userId = await getUserId()
  const qty = data.quantity ?? 1
  const existing = await db
    .select()
    .from(orderItems)
    .where(
      and(
        eq(orderItems.orderId, data.orderId),
        eq(orderItems.userId, userId),
        eq(orderItems.menuItemId, data.menuItemId),
        eq(orderItems.status, 'beklemede'),
      ),
    )
  if (existing.length > 0 && !data.note) {
    await db
      .update(orderItems)
      .set({ quantity: existing[0].quantity + qty })
      .where(eq(orderItems.id, existing[0].id))
  } else {
    await db.insert(orderItems).values({
      userId,
      orderId: data.orderId,
      menuItemId: data.menuItemId,
      name: data.name,
      price: String(data.price),
      quantity: qty,
      note: data.note,
    })
  }
  await recalcOrder(userId, data.orderId)
  revalidatePath('/pos')
  revalidatePath('/kitchen')
}

export async function updateItemQuantity(itemId: number, orderId: number, quantity: number) {
  const userId = await getUserId()
  if (quantity <= 0) {
    await db
      .delete(orderItems)
      .where(and(eq(orderItems.id, itemId), eq(orderItems.userId, userId)))
  } else {
    await db
      .update(orderItems)
      .set({ quantity })
      .where(and(eq(orderItems.id, itemId), eq(orderItems.userId, userId)))
  }
  await recalcOrder(userId, orderId)
  revalidatePath('/pos')
  revalidatePath('/kitchen')
}

export async function setItemStatus(itemId: number, status: string) {
  const userId = await getUserId()
  await db
    .update(orderItems)
    .set({ status })
    .where(and(eq(orderItems.id, itemId), eq(orderItems.userId, userId)))
  revalidatePath('/kitchen')
  revalidatePath('/pos')
}

export async function applyDiscount(orderId: number, discount: number) {
  const userId = await getUserId()
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  if (!order) return
  const total = Math.max(0, Number(order.subtotal) - discount)
  await db
    .update(orders)
    .set({ discount: String(discount), total: String(total) })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  revalidatePath('/pos')
}

export async function payOrder(orderId: number, paymentMethod: string) {
  const userId = await getUserId()
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  if (!order) return

  await db
    .update(orders)
    .set({ status: 'odendi', paymentMethod, closedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))

  await db.insert(transactions).values({
    userId,
    type: 'gelir',
    category: 'Satış',
    amount: order.total,
    description: `${order.orderNo} numaralı sipariş`,
    paymentMethod,
    orderId: order.id,
  })

  if (order.tableId) {
    await db
      .update(diningTables)
      .set({ status: 'bos' })
      .where(and(eq(diningTables.id, order.tableId), eq(diningTables.userId, userId)))
  }
  revalidatePath('/pos')
  revalidatePath('/accounting')
  revalidatePath('/reports')
  revalidatePath('/delivery')
}

export async function cancelOrder(orderId: number) {
  const userId = await getUserId()
  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  if (!order) return
  await db
    .update(orders)
    .set({ status: 'iptal', closedAt: new Date() })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  if (order.tableId) {
    await db
      .update(diningTables)
      .set({ status: 'bos' })
      .where(and(eq(diningTables.id, order.tableId), eq(diningTables.userId, userId)))
  }
  revalidatePath('/pos')
  revalidatePath('/delivery')
}

export async function setDeliveryStatus(orderId: number, status: string) {
  const userId = await getUserId()
  await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
  revalidatePath('/delivery')
}

export async function getDeliveryOrders() {
  const userId = await getUserId()
  const list = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), inArray(orders.type, ['paket', 'gel-al'])))
    .orderBy(desc(orders.createdAt))
  return list
}
