'use client'

import {
  adjustStock,
  createInventoryItem,
  deleteInventoryItem,
  updateInventoryItem,
} from '@/app/actions/inventory'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { inventoryItems } from '@/lib/db/schema'
import { formatTL } from '@/lib/format'
import { AlertTriangle, Loader2, Minus, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

type Item = typeof inventoryItems.$inferSelect

const emptyForm = {
  name: '',
  unit: 'adet',
  quantity: '',
  minQuantity: '',
  costPerUnit: '',
  supplier: '',
}

export function InventoryClient({ items }: { items: Item[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(item: Item) {
    setEditing(item)
    setForm({
      name: item.name,
      unit: item.unit,
      quantity: String(item.quantity),
      minQuantity: String(item.minQuantity),
      costPerUnit: String(item.costPerUnit),
      supplier: item.supplier ?? '',
    })
    setOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Ürün adı zorunludur')
      return
    }
    const data = {
      name: form.name.trim(),
      unit: form.unit.trim() || 'adet',
      quantity: Number.parseFloat(form.quantity) || 0,
      minQuantity: Number.parseFloat(form.minQuantity) || 0,
      costPerUnit: Number.parseFloat(form.costPerUnit) || 0,
      supplier: form.supplier.trim() || undefined,
    }
    startTransition(async () => {
      if (editing) {
        await updateInventoryItem(editing.id, data)
        toast.success('Stok güncellendi')
      } else {
        await createInventoryItem(data)
        toast.success('Stok eklendi')
      }
      setOpen(false)
      router.refresh()
    })
  }

  function isLow(item: Item) {
    return Number(item.quantity) <= Number(item.minQuantity)
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Stok Ekle
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ürün</TableHead>
              <TableHead>Miktar</TableHead>
              <TableHead>Min.</TableHead>
              <TableHead>Birim Maliyet</TableHead>
              <TableHead>Tedarikçi</TableHead>
              <TableHead className="w-32" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                  Stok kaydı bulunmuyor.
                </TableCell>
              </TableRow>
            )}
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {isLow(item) && (
                      <AlertTriangle className="size-4 shrink-0 text-destructive" />
                    )}
                    <span className="font-medium">{item.name}</span>
                    {isLow(item) && (
                      <Badge variant="destructive" className="text-[10px]">
                        Kritik
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await adjustStock(item.id, -1)
                          router.refresh()
                        })
                      }
                    >
                      <Minus className="size-3" />
                    </Button>
                    <span className="w-12 text-center text-sm font-medium">
                      {item.quantity} {item.unit}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-7"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await adjustStock(item.id, 1)
                          router.refresh()
                        })
                      }
                    >
                      <Plus className="size-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  {item.minQuantity} {item.unit}
                </TableCell>
                <TableCell>{formatTL(item.costPerUnit)}</TableCell>
                <TableCell className="text-muted-foreground">{item.supplier ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(item)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteInventoryItem(item.id)
                          toast.success('Stok silindi')
                          router.refresh()
                        })
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Stok Düzenle' : 'Yeni Stok'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Ürün Adı</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Birim</Label>
              <Input
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                placeholder="adet, kg, lt..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Miktar</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Minimum Miktar</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.minQuantity}
                onChange={(e) => setForm({ ...form, minQuantity: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Birim Maliyet (₺)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.costPerUnit}
                onChange={(e) => setForm({ ...form, costPerUnit: e.target.value })}
              />
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <Label>Tedarikçi</Label>
              <Input
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
