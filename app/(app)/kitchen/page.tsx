import { PageHeader } from '@/components/page-header'
import { KitchenClient } from '@/components/kitchen/kitchen-client'
import { getKitchenOrders } from '@/app/actions/orders'

export default async function KitchenPage() {
  const orders = await getKitchenOrders()
  return (
    <div className="flex flex-col">
      <PageHeader
        title="Mutfak Ekranı"
        description="Hazırlanmayı bekleyen ve hazırlanan siparişler"
      />
      <div className="p-4 md:p-6">
        <KitchenClient initialOrders={orders} />
      </div>
    </div>
  )
}
