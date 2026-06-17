import { PageHeader } from '@/components/page-header'
import { StaffClient } from '@/components/staff/staff-client'
import { getStaff } from '@/app/actions/staff'

export default async function ReportsPage() {
    return (
        <>
            <PageHeader title="Raporlar" description="Rapor yönetimi" />
        </>
    )
}
