'use client'

import { createTable, deleteTable, setTableStatus } from '@/app/actions/tables'
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
import type { diningTables } from '@/lib/db/schema'
import { cn } from '@/lib/utils'
import { Loader2, Plus, Trash2, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { toast } from 'sonner'

type Table = typeof diningTables.$inferSelect

const STATUS_LABELS: Record<string, string> = {
  bos: 'Boş',
  dolu: 'Dolu',
  rezerve: 'Rezerve',
}

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  bos: 'secondary',
  dolu: 'default',
  rezerve: 'outline',
}

export function TablesClient({ tables }: { tables: Table[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', area: 'Salon', seats: '4' })

  const byArea = useMemo(() => {
    const map = new Map<string, Table[]>()
    for (const t of tables) {
      const area = t.area ?? 'Salon'
      if (!map.has(area)) map.set(area, [])
      map.get(area)!.push(t)
    }
    return map
  }, [tables])

  function handleCreate() {
    if (!form.name.trim()) {
      toast.error('Masa adı zorunludur')
      return
    }
    startTransition(async () => {
      await createTable({
        name: form.name.trim(),
        area: form.area.trim() || 'Salon',
        seats: Number.parseInt(form.seats, 10) || 4,
      })
      setForm({ name: '', area: 'Salon', seats: '4' })
      setOpen(false)
      toast.success('Masa eklendi')
      router.refresh()
    })
  }

  function cycleStatus(table: Table) {
    const order = ['bos', 'dolu', 'rezerve']
    const idx = order.indexOf(table.status)
    const next = order[(idx + 1) % order.length]
    startTransition(async () => {
      await setTableStatus(table.id, next)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>
          <Plus className="size-4" /> Masa Ekle
        </Button>
      </div>

      {tables.length === 0 && (
        <p className="py-12 text-center text-muted-foreground">Henüz masa tanımlanmamış.</p>
      )}

      {Array.from(byArea.entries()).map(([area, areaTables]) => (
        <section key={area}>
          <h2 className="mb-3 font-heading text-base font-semibold">{area}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {areaTables.map((table) => (
              <div
                key={table.id}
                className={cn(
                  'relative flex flex-col gap-3 rounded-xl border p-4 transition-colors',
                  table.status === 'dolu' && 'border-primary/50 bg-primary/5',
                  table.status === 'rezerve' && 'border-amber-500/40 bg-amber-500/5',
                )}
              >
                <button
                  type="button"
                  className="absolute right-2 top-2 text-muted-foreground hover:text-destructive"
                  disabled={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await deleteTable(table.id)
                      toast.success('Masa silindi')
                      router.refresh()
                    })
                  }
                >
                  <Trash2 className="size-3.5" />
                </button>
                <div>
                  <p className="font-heading text-lg font-bold">{table.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="size-3" /> {table.seats} kişilik
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isPending}
                  onClick={() => cycleStatus(table)}
                >
                  <Badge variant={STATUS_VARIANT[table.status] ?? 'secondary'}>
                    {STATUS_LABELS[table.status] ?? table.status}
                  </Badge>
                </Button>
              </div>
            ))}
          </div>
        </section>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yeni Masa</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Masa Adı</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Örn: Masa 1"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Alan</Label>
              <Input
                value={form.area}
                onChange={(e) => setForm({ ...form, area: e.target.value })}
                placeholder="Salon, Teras, Bahçe..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Koltuk Sayısı</Label>
              <Input
                type="number"
                min="1"
                value={form.seats}
                onChange={(e) => setForm({ ...form, seats: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              İptal
            </Button>
            <Button onClick={handleCreate} disabled={isPending}>
              {isPending && <Loader2 className="size-4 animate-spin" />} Ekle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
