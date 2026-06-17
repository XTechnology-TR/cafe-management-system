'use server'

import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { getUserId } from '@/lib/session'
import { and, desc, eq, gte } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'

export async function getTransactions() {
  const userId = await getUserId()
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, userId))
    .orderBy(desc(transactions.createdAt))
}

export async function createTransaction(data: {
  type: string
  category: string
  amount: number
  description?: string
  paymentMethod?: string
}) {
  const userId = await getUserId()
  await db.insert(transactions).values({
    userId,
    type: data.type,
    category: data.category,
    amount: String(data.amount),
    description: data.description,
    paymentMethod: data.paymentMethod ?? 'nakit',
  })
  revalidatePath('/accounting')
  revalidatePath('/reports')
}

export async function deleteTransaction(id: number) {
  const userId = await getUserId()
  await db
    .delete(transactions)
    .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
  revalidatePath('/accounting')
  revalidatePath('/reports')
}

export async function getTransactionsSince(date: Date) {
  const userId = await getUserId()
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), gte(transactions.createdAt, date)))
    .orderBy(desc(transactions.createdAt))
}
