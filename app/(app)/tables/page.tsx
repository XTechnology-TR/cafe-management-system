import { PageHeader } from '@/components/page-header'
import { TablesClient } from '@/components/tables/tables-client'
import { getTables } from '@/app/actions/tables'

export default async function TablesPage() {
  const tables = await getTables()

  return (
    <>
      <PageHeader title="Masalar" description="Masa düzeni ve durum yönetimi" />
      <TablesClient tables={tables} />
    </>
  )
}
