import { PageHeader } from '@/components/page-header'
import { StaffClient } from '@/components/staff/staff-client'
import { getStaff } from '@/app/actions/staff'

export default async function StaffPage() {
  const staff = await getStaff()

  return (
    <>
      <PageHeader title="Personel" description="Çalışan yönetimi" />
      <StaffClient staff={staff} />
    </>
  )
}
