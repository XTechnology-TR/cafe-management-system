import { PageHeader } from '@/components/page-header'
import { PosClient } from '@/components/pos/pos-client'
import { getMenuItems, getCategories } from '@/app/actions/menu'
import { getTables } from '@/app/actions/tables'
import { getOpenOrders } from '@/app/actions/orders'

export default async function PosPage() {
  const [menuItems, categories, tables, openOrders] = await Promise.all([
    getMenuItems(),
    getCategories(),
    getTables(),
    getOpenOrders(),
  ])

  return (
    <>
      <PageHeader title="Kasa / POS" description="Sipariş alın ve ödeme işleyin" />
      <PosClient
        menuItems={menuItems}
        categories={categories}
        tables={tables}
        openOrders={openOrders}
      />
    </>
  )
}
