import { PageHeader } from '@/components/page-header'
import { InventoryClient } from '@/components/inventory/inventory-client'
import { getInventory } from '@/app/actions/inventory'

export default async function InventoryPage() {
  const items = await getInventory()

  return (
    <>
      <PageHeader title="Stok Takibi" description="Envanter ve stok seviyeleri" />
      <InventoryClient items={items} />
    </>
  )
}
