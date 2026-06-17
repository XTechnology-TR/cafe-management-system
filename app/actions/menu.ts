'use server'

import { db } from '@/lib/db'
import { categories, menuItems } from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getCategories() {
  const userId = await getUserId()
  return db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(asc(categories.sortOrder), asc(categories.name))
}

export async function createCategory(name: string, sortOrder = 0) {
  const userId = await getUserId()
  await db.insert(categories).values({ userId, name, sortOrder })
  revalidatePath('/menu')
  revalidatePath('/qr-menu')
}

export async function deleteCategory(id: number) {
  const userId = await getUserId()
  await db.delete(categories).where(and(eq(categories.id, id), eq(categories.userId, userId)))
  revalidatePath('/menu')
}

export async function getMenuItems() {
  const userId = await getUserId()
  return db
    .select()
    .from(menuItems)
    .where(eq(menuItems.userId, userId))
    .orderBy(asc(menuItems.name))
}

export async function createMenuItem(data: {
  name: string
  categoryId: number | null
  price: number
  description?: string
  imageUrl?: string
}) {
  const userId = await getUserId()
  await db.insert(menuItems).values({
    userId,
    name: data.name,
    categoryId: data.categoryId,
    price: String(data.price),
    description: data.description,
    imageUrl: data.imageUrl,
  })
  revalidatePath('/menu')
  revalidatePath('/qr-menu')
}

export async function updateMenuItem(
  id: number,
  data: {
    name: string
    categoryId: number | null
    price: number
    description?: string
    available: boolean
  },
) {
  const userId = await getUserId()
  await db
    .update(menuItems)
    .set({
      name: data.name,
      categoryId: data.categoryId,
      price: String(data.price),
      description: data.description,
      available: data.available,
    })
    .where(and(eq(menuItems.id, id), eq(menuItems.userId, userId)))
  revalidatePath('/menu')
  revalidatePath('/qr-menu')
}

export async function toggleMenuItem(id: number, available: boolean) {
  const userId = await getUserId()
  await db
    .update(menuItems)
    .set({ available })
    .where(and(eq(menuItems.id, id), eq(menuItems.userId, userId)))
  revalidatePath('/menu')
}

export async function deleteMenuItem(id: number) {
  const userId = await getUserId()
  await db.delete(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.userId, userId)))
  revalidatePath('/menu')
}
