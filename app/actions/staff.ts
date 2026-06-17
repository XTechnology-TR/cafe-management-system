'use server'

import { db } from '@/lib/db'
import { staff } from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { and, asc, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getStaff() {
  const userId = await getUserId()
  return db.select().from(staff).where(eq(staff.userId, userId)).orderBy(asc(staff.name))
}

export async function createStaff(data: {
  name: string
  role: string
  phone?: string
  pin?: string
}) {
  const userId = await getUserId()
  await db.insert(staff).values({
    userId,
    name: data.name,
    role: data.role,
    phone: data.phone,
    pin: data.pin,
  })
  revalidatePath('/staff')
}

export async function updateStaff(
  id: number,
  data: { name: string; role: string; phone?: string; pin?: string; active: boolean },
) {
  const userId = await getUserId()
  await db
    .update(staff)
    .set({
      name: data.name,
      role: data.role,
      phone: data.phone,
      pin: data.pin,
      active: data.active,
    })
    .where(and(eq(staff.id, id), eq(staff.userId, userId)))
  revalidatePath('/staff')
}

export async function deleteStaff(id: number) {
  const userId = await getUserId()
  await db.delete(staff).where(and(eq(staff.id, id), eq(staff.userId, userId)))
  revalidatePath('/staff')
}
