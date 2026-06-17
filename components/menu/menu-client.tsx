'use client'

import {
  createCategory,
  createMenuItem,
  deleteCategory,
  deleteMenuItem,
  toggleMenuItem,
  updateMenuItem,
} from '@/app/actions/menu'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import type { categories, menuItems } from '@/lib/db/schema'
import { formatTL } from '@/lib/format'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

type Category = typeof categories.$inferSelect
type MenuItem = typeof menuItems.$inferSelect

export function MenuClient({
  categories: cats,
  menuItems: items,
}: {
  categories: Category[]
  menuItems: MenuItem[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [catOpen, setCatOpen] = useState(false)
  const [catName, setCatName] = useState('')
  const [itemOpen, setItemOpen] = useState(false)
  const [editing, setEditing] = useState<MenuItem | null>(null)
  const [form, setForm] = useState({
    name: '',
    categoryId: '' as string,
    price: '',
    description: '',
    available: true,
  })

  function openCreate() {
    setEditing(null)
    setForm({ name: '', categoryId: '', price: '', description: '', available: true })
    setItemOpen(true)
  }

  function openEdit(item: MenuItem) {
    setEditing(item)
    setForm({
      name: item.name,
      categoryId: item.categoryId ? String(item.categoryId) : '',
      price: String(item.price),
      description: item.description ?? '',
      available: item.available,
    })
    setItemOpen(true)
  }

  function handleSaveItem() {
    if (!form.name || !form.price) {
      toast.error('Ürün adı ve fiyat zorunludur')
      return
    }
    startTransition(async () => {
      const data = {
        name: form.name,
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        price: Number.parseFloat(form.price),
        description: form.description || undefined,
        available: form.available,
      }
      if (editing) {
        await updateMenuItem(editing.id, data)
        toast.success('Ürün güncellendi')
      } else {
        await createMenuItem(data)
        toast.success('Ürün eklendi')
      }
      setItemOpen(false)
      router.refresh()
    })
  }

  function handleCreateCategory() {
    if (!catName.trim()) return
    startTransition(async () => {
      await createCategory(catName.trim())
      setCatName('')
      setCatOpen(false)
      toast.success('Kategori eklendi')
      router.refresh()
    })
  }

  function catNameById(id: number | null) {
    if (!id) return '—'
    return cats.find((c) => c.id === id)?.name ?? '—'
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold">Kategoriler</h2>
          <Button size="sm" variant="outline" onClick={() => setCatOpen(true)}>
            <Plus className="size-4" /> Kategori Ekle
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {cats.length === 0 && (
            <p className="text-sm text-muted-foreground">Henüz kategori yok.</p>
          )}
          {cats.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-2 px-3 py-1.5 text-sm">
              {c.name}
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                disabled={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteCategory(c.id)
                    toast.success('Kategori silindi')
                    router.refresh()
                  })
                }
              >
                <Trash2 className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-base font-semibold">Menü Ürünleri</h2>
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" /> Ürün Ekle
          </Button>
        </div>
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                    Henüz ürün eklenmemiş.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{catNameById(item.categoryId)}</TableCell>
                  <TableCell>{formatTL(item.price)}</TableCell>
                  <TableCell>
                    <Switch
                      checked={item.available}
                      disabled={isPending}
                      onCheckedChange={(checked) =>
                        startTransition(async () => {
                          await toggleMenuItem(item.id, checked)
                          router.refresh()
                        })
                      }
                    />
                  </TableCell>
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
                            await deleteMenuItem(item.id)
                            toast.success('Ürün silindi')
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
      </section>

      <Dialog open={catOpen} onOpenChange={setCatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Kategori</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="cat-name">Kategori Adı</Label>
            <Input
              id="cat-name"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              placeholder="Örn: İçecekler"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCreateCategory} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />} Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Ürün Düzenle' : 'Yeni Ürün'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Ürün Adı</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Kategori</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {cats.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Fiyat (₺)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Açıklama</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.available}
                onCheckedChange={(checked) => setForm({ ...form, available: checked })}
              />
              <Label>Satışta</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveItem} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />} Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
