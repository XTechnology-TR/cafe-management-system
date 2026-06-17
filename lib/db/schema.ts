import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'

// ---------- Better Auth tables ----------
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// ---------- App tables ----------
export const staff = pgTable('staff', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('garson'),
  phone: text('phone'),
  pin: text('pin'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  sortOrder: integer('sortOrder').notNull().default(0),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  categoryId: integer('categoryId'),
  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  imageUrl: text('imageUrl'),
  available: boolean('available').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const inventoryItems = pgTable('inventory_items', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  unit: text('unit').notNull().default('adet'),
  quantity: numeric('quantity', { precision: 10, scale: 2 }).notNull().default('0'),
  minQuantity: numeric('minQuantity', { precision: 10, scale: 2 }).notNull().default('0'),
  costPerUnit: numeric('costPerUnit', { precision: 10, scale: 2 }).notNull().default('0'),
  supplier: text('supplier'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const diningTables = pgTable('dining_tables', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name').notNull(),
  area: text('area').default('Salon'),
  seats: integer('seats').notNull().default(4),
  status: text('status').notNull().default('bos'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  orderNo: text('orderNo').notNull(),
  type: text('type').notNull().default('masa'),
  tableId: integer('tableId'),
  status: text('status').notNull().default('acik'),
  customerName: text('customerName'),
  customerPhone: text('customerPhone'),
  customerAddress: text('customerAddress'),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull().default('0'),
  discount: numeric('discount', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull().default('0'),
  paymentMethod: text('paymentMethod'),
  note: text('note'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  closedAt: timestamp('closedAt'),
})

export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  orderId: integer('orderId').notNull(),
  menuItemId: integer('menuItemId'),
  name: text('name').notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  quantity: integer('quantity').notNull().default(1),
  status: text('status').notNull().default('beklemede'),
  note: text('note'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: text('userId').notNull(),
  type: text('type').notNull().default('gelir'),
  category: text('category').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull().default('0'),
  description: text('description'),
  paymentMethod: text('paymentMethod').default('nakit'),
  orderId: integer('orderId'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
