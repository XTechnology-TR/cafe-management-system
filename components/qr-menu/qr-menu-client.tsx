'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { categories, menuItems } from '@/lib/db/schema'
import { formatTL } from '@/lib/format'
import { QrCode, Utensils } from 'lucide-react'

type Category = typeof categories.$inferSelect
type MenuItem = typeof menuItems.$inferSelect

export function QrMenuClient({
  categories: cats,
  menuItems: items,
}: {
  categories: Category[]
  menuItems: MenuItem[]
}) {
  const available = items.filter((i) => i.available)
  const uncategorized = available.filter((i) => !i.categoryId)

  function itemsForCategory(catId: number) {
    return available.filter((i) => i.categoryId === catId)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted">
            <QrCode className="size-12 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-heading text-lg font-semibold">QR Menü Önizleme</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Müşterilerinizin göreceği menü görünümü aşağıdadır. Bu sayfayı yazdırarak
              veya QR kod oluşturucu ile paylaşabilirsiniz.
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              URL:{' '}
              <code className="rounded bg-muted px-1.5 py-0.5">
                {typeof window !== 'undefined' ? window.location.href : '/qr-menu'}
              </code>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mx-auto w-full max-w-lg rounded-3xl border border-border bg-card shadow-lg">
        <div className="border-b border-border bg-primary px-6 py-8 text-center text-primary-foreground">
          <Utensils className="mx-auto mb-2 size-8" />
          <h1 className="font-heading text-2xl font-bold">Menümüz</h1>
          <p className="mt-1 text-sm opacity-80">Taze ve lezzetli seçenekler</p>
        </div>

        <div className="flex flex-col gap-6 p-6">
          {cats.map((cat) => {
            const catItems = itemsForCategory(cat.id)
            if (catItems.length === 0) return null
            return (
              <section key={cat.id}>
                <h2 className="mb-3 border-b border-border pb-2 font-heading text-lg font-semibold text-foreground">
                  {cat.name}
                </h2>
                <ul className="flex flex-col gap-3">
                  {catItems.map((item) => (
                    <li key={item.id} className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 font-semibold text-primary">
                        {formatTL(item.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}

          {uncategorized.length > 0 && (
            <section>
              <h2 className="mb-3 border-b border-border pb-2 font-heading text-lg font-semibold">
                Diğer
              </h2>
              <ul className="flex flex-col gap-3">
                {uncategorized.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-4">
                    <p className="font-medium">{item.name}</p>
                    <span className="font-semibold text-primary">{formatTL(item.price)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {available.length === 0 && (
            <div className="py-12 text-center">
              <Badge variant="secondary">Menüde satışa açık ürün bulunmuyor</Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Menü Yönetimi sayfasından ürün ekleyin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
