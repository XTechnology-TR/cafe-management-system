'use server'

import { db } from '@/lib/db'
import {
  inventoryItems,
  orders,
  orderItems,
  transactions,
} from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { and, eq, gte, inArray, sql } from 'drizzle-orm'

export async function getDashboardStats() {
  const userId = await getUserId()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const todaysTx = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.createdAt, startOfDay)))

  const income = todaysTx
    .filter((t) => t.type === 'gelir')
    .reduce((s, t) => s + Number(t.amount), 0)
  const expense = todaysTx
    .filter((t) => t.type === 'gider')
    .reduce((s, t) => s + Number(t.amount), 0)

  const paidToday = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, 'odendi'),
        gte(orders.closedAt, startOfDay),
      ),
    )

  const openOrders = await db
    .select()
    .from(orders)
    .where(and(eq(orders.userId, userId), eq(orders.status, 'acik')))

  const lowStock = await db
    .select()
    .from(inventoryItems)
    .where(
      and(
        eq(inventoryItems.userId, userId),
        sql`${inventoryItems.quantity} <= ${inventoryItems.minQuantity}`,
      ),
    )

  const orderCount = paidToday.length
  const avgTicket = orderCount > 0 ? income / orderCount : 0

  return {
    income,
    expense,
    net: income - expense,
    orderCount,
    avgTicket,
    openOrderCount: openOrders.length,
    lowStockCount: lowStock.length,
    lowStockItems: lowStock.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: Number(i.quantity),
      minQuantity: Number(i.minQuantity),
      unit: i.unit,
    })),
  }
}

export async function getWeeklySales() {
  const userId = await getUserId()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  const rows = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.type, 'gelir'),
        gte(transactions.createdAt, start),
      ),
    )

  const days: { label: string; total: number }[] = []
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const next = new Date(d)
    next.setDate(next.getDate() + 1)
    const total = rows
      .filter((r) => r.createdAt >= d && r.createdAt < next)
      .reduce((s, r) => s + Number(r.amount), 0)
    days.push({ label: dayNames[d.getDay()], total })
  }
  return days
}

export async function getTopSellingItems() {
  const userId = await getUserId()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  const paidOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(
      and(
        eq(orders.userId, userId),
        eq(orders.status, 'odendi'),
        gte(orders.createdAt, start),
      ),
    )
  if (paidOrders.length === 0) return [] as { name: string; quantity: number }[]

  const items = await db
    .select()
    .from(orderItems)
    .where(
      and(
        eq(orderItems.userId, userId),
        inArray(
          orderItems.orderId,
          paidOrders.map((o) => o.id),
        ),
      ),
    )

  const map = new Map<string, number>()
  for (const i of items) {
    map.set(i.name, (map.get(i.name) ?? 0) + i.quantity)
  }
  return Array.from(map.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5)
}
