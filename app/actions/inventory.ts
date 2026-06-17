'use server'

import { db } from '@/lib/db'
import { inventoryItems } from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getInventory() {
  const userId = await getUserId()
  return db
    .select()
    .from(inventoryItems)
    .where(eq(inventoryItems.userId, userId))
    .orderBy(asc(inventoryItems.name))
}

export async function createInventoryItem(data: {
  name: string
  unit: string
  quantity: number
  minQuantity: number
  costPerUnit: number
  supplier?: string
}) {
  const userId = await getUserId()
  await db.insert(inventoryItems).values({
    userId,
    name: data.name,
    unit: data.unit,
    quantity: String(data.quantity),
    minQuantity: String(data.minQuantity),
    costPerUnit: String(data.costPerUnit),
    supplier: data.supplier,
  })
  revalidatePath('/inventory')
}

export async function updateInventoryItem(
  id: number,
  data: {
    name: string
    unit: string
    quantity: number
    minQuantity: number
    costPerUnit: number
    supplier?: string
  },
) {
  const userId = await getUserId()
  await db
    .update(inventoryItems)
    .set({
      name: data.name,
      unit: data.unit,
      quantity: String(data.quantity),
      minQuantity: String(data.minQuantity),
      costPerUnit: String(data.costPerUnit),
      supplier: data.supplier,
    })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
  revalidatePath('/inventory')
}

export async function adjustStock(id: number, delta: number) {
  const userId = await getUserId()
  const [item] = await db
    .select()
    .from(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
  if (!item) return
  const next = Math.max(0, Number(item.quantity) + delta)
  await db
    .update(inventoryItems)
    .set({ quantity: String(next) })
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
  revalidatePath('/inventory')
}

export async function deleteInventoryItem(id: number) {
  const userId = await getUserId()
  await db
    .delete(inventoryItems)
    .where(and(eq(inventoryItems.id, id), eq(inventoryItems.userId, userId)))
  revalidatePath('/inventory')
}
