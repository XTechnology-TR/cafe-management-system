'use client'

import { setItemStatus, type OrderWithItems } from '@/app/actions/orders'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Check, ChefHat, Clock, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'

const STATUS_LABELS: Record<string, string> = {
  beklemede: 'Beklemede',
  hazirlaniyor: 'Hazırlanıyor',
  hazir: 'Hazır',
}

const STATUS_COLORS: Record<string, string> = {
  beklemede: 'border-amber-500/40 bg-amber-500/5',
  hazirlaniyor: 'border-blue-500/40 bg-blue-500/5',
  hazir: 'border-emerald-500/40 bg-emerald-500/5',
}

const NEXT_STATUS: Record<string, string | null> = {
  beklemede: 'hazirlaniyor',
  hazirlaniyor: 'hazir',
  hazir: null,
}

export function KitchenClient({ initialOrders }: { initialOrders: OrderWithItems[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleStatus(itemId: number, current: string) {
    const next = NEXT_STATUS[current]
    if (!next) return
    startTransition(async () => {
      await setItemStatus(itemId, next)
      router.refresh()
      if (next === 'hazir') toast.success('Ürün hazır olarak işaretlendi')
    })
  }

  const pending = initialOrders.filter((o) =>
    o.items.some((i) => i.status !== 'hazir'),
  )

  if (pending.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <ChefHat className="size-12 text-muted-foreground/40" />
        <p className="text-lg font-medium text-foreground">Bekleyen sipariş yok</p>
        <p className="text-sm text-muted-foreground">
          POS&apos;tan yeni sipariş geldiğinde burada görünecek.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {pending.map(({ order, items }) => (
        <Card key={order.id} className="overflow-hidden">
          <CardHeader className="border-b border-border bg-muted/30 pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{order.orderNo}</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {order.type === 'masa'
                    ? 'Masa siparişi'
                    : order.type === 'paket'
                      ? 'Paket Servis'
                      : order.type === 'gel-al'
                        ? 'Gel-Al'
                        : order.type}
                  {order.customerName && ` · ${order.customerName}`}
                </p>
              </div>
              <Badge variant="outline" className="shrink-0 gap-1">
                <Clock className="size-3" />
                {formatDateTime(order.createdAt)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-4">
            {items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'flex items-center justify-between gap-3 rounded-lg border p-3',
                  STATUS_COLORS[item.status] ?? 'border-border',
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">
                    {item.quantity}x {item.name}
                  </p>
                  {item.note && (
                    <p className="mt-0.5 text-xs text-muted-foreground italic">
                      Not: {item.note}
                    </p>
                  )}
                  <Badge variant="secondary" className="mt-1.5 h-5 text-[10px]">
                    {STATUS_LABELS[item.status] ?? item.status}
                  </Badge>
                </div>
                {NEXT_STATUS[item.status] ? (
                  <Button
                    size="sm"
                    variant={item.status === 'hazirlaniyor' ? 'default' : 'outline'}
                    disabled={isPending}
                    onClick={() => handleStatus(item.id, item.status)}
                  >
                    {isPending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : item.status === 'hazirlaniyor' ? (
                      <>
                        <Check className="size-4" /> Hazır
                      </>
                    ) : (
                      'Başla'
                    )}
                  </Button>
                ) : (
                  <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                    <Check className="size-3" /> Hazır
                  </Badge>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
