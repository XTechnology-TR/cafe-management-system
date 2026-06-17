import { PageHeader } from '@/components/page-header'
import { WeeklySalesChart } from '@/components/weekly-sales-chart'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getDashboardStats,
  getTopSellingItems,
  getWeeklySales,
} from '@/app/actions/dashboard'
import { formatTL } from '@/lib/format'
import {
  AlertTriangle,
  CreditCard,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const [stats, weekly, topItems] = await Promise.all([
    getDashboardStats(),
    getWeeklySales(),
    getTopSellingItems(),
  ])

  const cards = [
    {
      label: 'Bugünkü Ciro',
      value: formatTL(stats.income),
      icon: Wallet,
      tone: 'text-chart-2',
    },
    {
      label: 'Bugünkü Gider',
      value: formatTL(stats.expense),
      icon: TrendingDown,
      tone: 'text-destructive',
    },
    {
      label: 'Net Kazanç',
      value: formatTL(stats.net),
      icon: TrendingUp,
      tone: 'text-primary',
    },
    {
      label: 'Sipariş Sayısı',
      value: String(stats.orderCount),
      icon: Receipt,
      tone: 'text-chart-4',
    },
  ]

  const maxTop = Math.max(1, ...topItems.map((i) => i.quantity))

  return (
    <>
      <PageHeader title="Genel Bakış" description="İşletmenizin günlük özeti" />
      <main className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label}>
              <CardContent className="flex items-center justify-between gap-4 p-5">
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-muted-foreground">{c.label}</span>
                  <span className="font-heading text-2xl font-bold text-foreground">
                    {c.value}
                  </span>
                </div>
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                  <c.icon className={`size-5 ${c.tone}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link href="/pos">
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="size-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Açık Adisyonlar</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.openOrderCount} aktif sipariş
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/inventory">
            <Card className="transition-colors hover:border-primary">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-accent/40">
                  <AlertTriangle className="size-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Kritik Stok</p>
                  <p className="text-sm text-muted-foreground">
                    {stats.lowStockCount} ürün azaldı
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-11 items-center justify-center rounded-xl bg-chart-4/10">
                <Receipt className="size-5 text-chart-4" />
              </div>
              <div>
                <p className="font-medium text-foreground">Ortalama Adisyon</p>
                <p className="text-sm text-muted-foreground">
                  {formatTL(stats.avgTicket)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Haftalık Ciro</CardTitle>
            </CardHeader>
            <CardContent>
              <WeeklySalesChart data={weekly} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>En Çok Satanlar</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {topItems.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Henüz satış verisi bulunmuyor.
                </p>
              )}
              {topItems.map((item, idx) => (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      <span className="flex size-5 items-center justify-center rounded bg-muted text-xs">
                        {idx + 1}
                      </span>
                      {item.name}
                    </span>
                    <span className="text-muted-foreground">{item.quantity} adet</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${(item.quantity / maxTop) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        {stats.lowStockItems.length > 0 && (
          <section>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4 text-destructive" />
                  Kritik Stok Uyarıları
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {stats.lowStockItems.map((i) => (
                  <Badge key={i.id} variant="outline" className="gap-1.5 border-destructive/40">
                    {i.name}
                    <span className="text-destructive">
                      {i.quantity} {i.unit}
                    </span>
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </section>
        )}
      </main>
    </>
  )
}
