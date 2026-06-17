'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { categories, diningTables, menuItems } from '@/lib/db/schema'
import type { OrderWithItems } from '@/app/actions/orders'
import {
  addOrderItem,
  applyDiscount,
  cancelOrder,
  createOrder,
  payOrder,
  updateItemQuantity,
} from '@/app/actions/orders'
import { formatTL } from '@/lib/format'
import { cn } from '@/lib/utils'
import {
  Banknote,
  CreditCard,
  Minus,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from 'lucide-react'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

type MenuItem = typeof menuItems.$inferSelect
type Category = typeof categories.$inferSelect
type Table = typeof diningTables.$inferSelect

export function PosClient({
  menuItems,
  categories,
  tables,
  openOrders,
}: {
  menuItems: MenuItem[]
  categories: Category[]
  tables: Table[]
  openOrders: OrderWithItems[]
}) {
  const [activeOrderId, setActiveOrderId] = useState<number | null>(
    openOrders[0]?.order.id ?? null,
  )
  const [search, setSearch] = useState('')
  const [activeCat, setActiveCat] = useState<number | 'all'>('all')
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)
  const [discountOpen, setDiscountOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const activeOrder = openOrders.find((o) => o.order.id === activeOrderId)

  const filteredItems = useMemo(() => {
    return menuItems
      .filter((m) => m.available)
      .filter((m) => (activeCat === 'all' ? true : m.categoryId === activeCat))
      .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()))
  }, [menuItems, activeCat, search])

  function tableName(id: number | null) {
    if (!id) return null
    return tables.find((t) => t.id === id)?.name ?? null
  }

  function handleAddItem(item: MenuItem) {
    if (!activeOrderId) {
      toast.error('Önce bir adisyon açın')
      return
    }
    startTransition(async () => {
      await addOrderItem({
        orderId: activeOrderId,
        menuItemId: item.id,
        name: item.name,
        price: Number(item.price),
      })
    })
  }

  function handleQty(itemId: number, qty: number) {
    if (!activeOrderId) return
    startTransition(async () => {
      await updateItemQuantity(itemId, activeOrderId, qty)
    })
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4 lg:flex-row">
      {/* Menu side */}
      <div className="flex flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Ürün ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <OpenOrderSwitcher
              openOrders={openOrders}
              activeOrderId={activeOrderId}
              onSelect={setActiveOrderId}
              tableName={tableName}
              onNew={() => setNewOrderOpen(true)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryChip
              active={activeCat === 'all'}
              onClick={() => setActiveCat('all')}
            >
              Tümü
            </CategoryChip>
            {categories.map((c) => (
              <CategoryChip
                key={c.id}
                active={activeCat === c.id}
                onClick={() => setActiveCat(c.id)}
              >
                {c.name}
              </CategoryChip>
            ))}
          </div>
        </div>

        <div className="grid flex-1 auto-rows-min grid-cols-2 gap-3 overflow-y-auto pb-4 sm:grid-cols-3 xl:grid-cols-4">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleAddItem(item)}
              disabled={isPending}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary hover:bg-accent/30 disabled:opacity-60"
            >
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl || '/placeholder.svg'}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <Utensils className="size-6 text-muted-foreground" />
                )}
              </div>
              <span className="line-clamp-2 text-sm font-medium text-foreground">
                {item.name}
              </span>
              <span className="text-sm font-semibold text-primary">
                {formatTL(item.price)}
              </span>
            </button>
          ))}
          {filteredItems.length === 0 && (
            <p className="col-span-full py-12 text-center text-sm text-muted-foreground">
              Ürün bulunamadı. Menü Yönetimi sayfasından ürün ekleyin.
            </p>
          )}
        </div>
      </div>

      {/* Cart side */}
      <aside className="flex w-full flex-col rounded-2xl border border-border bg-card lg:w-96">
        <div className="flex items-center justify-between border-b border-border p-4">
          <div>
            <p className="font-heading font-semibold text-foreground">
              {activeOrder ? activeOrder.order.orderNo : 'Adisyon Seçili Değil'}
            </p>
            {activeOrder && (
              <p className="text-xs text-muted-foreground">
                {activeOrder.order.type === 'masa'
                  ? tableName(activeOrder.order.tableId) ?? 'Masa'
                  : activeOrder.order.type === 'paket'
                    ? 'Paket Servis'
                    : activeOrder.order.type === 'gel-al'
                      ? 'Gel-Al'
                      : 'Adisyon'}
              </p>
            )}
          </div>
          {!activeOrder && (
            <Button size="sm" onClick={() => setNewOrderOpen(true)}>
              <Plus className="size-4" /> Yeni
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!activeOrder || activeOrder.items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sepet boş. Soldan ürün ekleyin.
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {activeOrder.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTL(item.price)}
                      {item.status === 'hazir' && (
                        <Badge variant="secondary" className="ml-2 h-4 text-[10px]">
                          Hazır
                        </Badge>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => handleQty(item.id, item.quantity - 1)}
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      onClick={() => handleQty(item.id, item.quantity + 1)}
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                  <span className="w-16 text-right text-sm font-semibold text-foreground">
                    {formatTL(Number(item.price) * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {activeOrder && (
          <div className="border-t border-border p-4">
            <div className="flex flex-col gap-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Ara Toplam</span>
                <span>{formatTL(activeOrder.order.subtotal)}</span>
              </div>
              {Number(activeOrder.order.discount) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>İndirim</span>
                  <span>-{formatTL(activeOrder.order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-heading text-lg font-bold text-foreground">
                <span>Toplam</span>
                <span>{formatTL(activeOrder.order.total)}</span>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => setDiscountOpen(true)}>
                İndirim
              </Button>
              <Button
                variant="outline"
                className="text-destructive"
                onClick={() => {
                  startTransition(async () => {
                    await cancelOrder(activeOrder.order.id)
                    setActiveOrderId(null)
                    toast.success('Adisyon iptal edildi')
                  })
                }}
              >
                <X className="size-4" /> İptal
              </Button>
              <Button
                className="col-span-2"
                disabled={activeOrder.items.length === 0}
                onClick={() => setPayOpen(true)}
              >
                <CreditCard className="size-4" /> Ödeme Al ·{' '}
                {formatTL(activeOrder.order.total)}
              </Button>
            </div>
          </div>
        )}
      </aside>

      <NewOrderDialog
        open={newOrderOpen}
        onOpenChange={setNewOrderOpen}
        tables={tables}
        onCreated={(id) => setActiveOrderId(id)}
        isPending={isPending}
        startTransition={startTransition}
      />

      {activeOrder && (
        <>
          <PayDialog
            open={payOpen}
            onOpenChange={setPayOpen}
            total={activeOrder.order.total}
            onPay={(method) => {
              startTransition(async () => {
                await payOrder(activeOrder.order.id, method)
                setPayOpen(false)
                setActiveOrderId(null)
                toast.success('Ödeme alındı')
              })
            }}
          />
          <DiscountDialog
            open={discountOpen}
            onOpenChange={setDiscountOpen}
            onApply={(amount) => {
              startTransition(async () => {
                await applyDiscount(activeOrder.order.id, amount)
                setDiscountOpen(false)
                toast.success('İndirim uygulandı')
              })
            }}
          />
        </>
      )}
    </div>
  )
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:border-primary/40',
      )}
    >
      {children}
    </button>
  )
}

function OpenOrderSwitcher({
  openOrders,
  activeOrderId,
  onSelect,
  tableName,
  onNew,
}: {
  openOrders: OrderWithItems[]
  activeOrderId: number | null
  onSelect: (id: number) => void
  tableName: (id: number | null) => string | null
  onNew: () => void
}) {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeOrderId ? String(activeOrderId) : ''}
        onValueChange={(v) => onSelect(Number(v))}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="Açık adisyonlar" />
        </SelectTrigger>
        <SelectContent>
          {openOrders.length === 0 && (
            <div className="px-2 py-1.5 text-sm text-muted-foreground">
              Açık adisyon yok
            </div>
          )}
          {openOrders.map((o) => (
            <SelectItem key={o.order.id} value={String(o.order.id)}>
              {o.order.orderNo} ·{' '}
              {o.order.type === 'masa'
                ? tableName(o.order.tableId) ?? 'Masa'
                : o.order.type === 'paket'
                  ? 'Paket'
                  : 'Gel-Al'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="icon" onClick={onNew}>
        <Plus className="size-4" />
      </Button>
    </div>
  )
}

function NewOrderDialog({
  open,
  onOpenChange,
  tables,
  onCreated,
  isPending,
  startTransition,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  tables: Table[]
  onCreated: (id: number) => void
  isPending: boolean
  startTransition: (cb: () => void) => void
}) {
  const [type, setType] = useState('masa')
  const [tableId, setTableId] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerAddress, setCustomerAddress] = useState('')

  function submit() {
    if (type === 'masa' && !tableId) {
      toast.error('Lütfen masa seçin')
      return
    }
    startTransition(async () => {
      const id = await createOrder({
        type,
        tableId: type === 'masa' ? Number(tableId) : null,
        customerName: customerName || undefined,
        customerPhone: customerPhone || undefined,
        customerAddress: type === 'paket' ? customerAddress || undefined : undefined,
      })
      onCreated(id)
      onOpenChange(false)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerAddress('')
      setTableId('')
      toast.success('Adisyon açıldı')
    })
  }

  const freeTables = tables.filter((t) => t.status !== 'dolu')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yeni Adisyon</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label>Sipariş Tipi</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="masa">Masa</SelectItem>
                <SelectItem value="paket">Paket Servis</SelectItem>
                <SelectItem value="gel-al">Gel-Al</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === 'masa' && (
            <div className="flex flex-col gap-2">
              <Label>Masa</Label>
              <Select value={tableId} onValueChange={setTableId}>
                <SelectTrigger>
                  <SelectValue placeholder="Masa seçin" />
                </SelectTrigger>
                <SelectContent>
                  {freeTables.map((t) => (
                    <SelectItem key={t.id} value={String(t.id)}>
                      {t.area} · {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {(type === 'paket' || type === 'gel-al') && (
            <>
              <div className="flex flex-col gap-2">
                <Label>Müşteri Adı</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ad Soyad"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Telefon</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05XX XXX XX XX"
                />
              </div>
              {type === 'paket' && (
                <div className="flex flex-col gap-2">
                  <Label>Adres</Label>
                  <Input
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="Teslimat adresi"
                  />
                </div>
              )}
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={submit} disabled={isPending}>
            Adisyon Aç
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PayDialog({
  open,
  onOpenChange,
  total,
  onPay,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  total: string
  onPay: (method: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ödeme Al</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-1 py-2">
          <span className="text-sm text-muted-foreground">Tahsil edilecek tutar</span>
          <span className="font-heading text-3xl font-bold text-foreground">
            {formatTL(total)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => onPay('nakit')}
          >
            <Banknote className="size-6" />
            Nakit
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => onPay('kart')}
          >
            <CreditCard className="size-6" />
            Kredi Kartı
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DiscountDialog({
  open,
  onOpenChange,
  onApply,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onApply: (amount: number) => void
}) {
  const [amount, setAmount] = useState('')
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>İndirim Uygula</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label>İndirim Tutarı (TL)</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Vazgeç
          </Button>
          <Button onClick={() => onApply(Number(amount) || 0)}>Uygula</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
