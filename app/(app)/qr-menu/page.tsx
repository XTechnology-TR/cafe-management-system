import { PageHeader } from '@/components/page-header'
import { QrMenuClient } from '@/components/qr-menu/qr-menu-client'
import { getCategories, getMenuItems } from '@/app/actions/menu'

export default async function QrMenuPage() {
  const [categories, menuItems] = await Promise.all([getCategories(), getMenuItems()])

  return (
    <>
      <PageHeader title="QR Menü" description="Müşteri menüsü önizlemesi" />
      <QrMenuClient categories={categories} menuItems={menuItems} />
    </>
  )
}
