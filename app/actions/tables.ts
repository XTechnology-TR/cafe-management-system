'use server'

import { db } from '@/lib/db'
import { diningTables } from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getTables() {
  const userId = await getUserId()
  return db
    .select()
    .from(diningTables)
    .where(eq(diningTables.userId, userId))
    .orderBy(asc(diningTables.area), asc(diningTables.name))
}

export async function createTable(data: { name: string; area: string; seats: number }) {
  const userId = await getUserId()
  await db.insert(diningTables).values({
    userId,
    name: data.name,
    area: data.area,
    seats: data.seats,
  })
  revalidatePath('/tables')
  revalidatePath('/pos')
}

export async function deleteTable(id: number) {
  const userId = await getUserId()
  await db
    .delete(diningTables)
    .where(and(eq(diningTables.id, id), eq(diningTables.userId, userId)))
  revalidatePath('/tables')
  revalidatePath('/pos')
}

export async function setTableStatus(id: number, status: string) {
  const userId = await getUserId()
  await db
    .update(diningTables)
    .set({ status })
    .where(and(eq(diningTables.id, id), eq(diningTables.userId, userId)))
  revalidatePath('/tables')
  revalidatePath('/pos')
}
