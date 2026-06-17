import { PageHeader } from '@/components/page-header'
import { MenuClient } from '@/components/menu/menu-client'
import { getCategories, getMenuItems } from '@/app/actions/menu'

export default async function MenuPage() {
  const [categories, menuItems] = await Promise.all([getCategories(), getMenuItems()])

  return (
    <>
      <PageHeader title="Menü Yönetimi" description="Kategorileri ve ürünleri yönetin" />
      <MenuClient categories={categories} menuItems={menuItems} />
    </>
  )
}
