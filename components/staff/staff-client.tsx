'use client'

import { createStaff, deleteStaff, updateStaff } from '@/app/actions/staff'
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
import type { staff } from '@/lib/db/schema'
import { ROLE_LABELS, type Role } from '@/lib/format'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

type Staff = typeof staff.$inferSelect

const ROLES: Role[] = ['admin', 'kasiyer', 'garson', 'mutfak']

const emptyForm = {
  name: '',
  role: 'garson' as Role,
  phone: '',
  pin: '',
  active: true,
}

export function StaffClient({ staff: members }: { staff: Staff[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [form, setForm] = useState(emptyForm)

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setOpen(true)
  }

  function openEdit(member: Staff) {
    setEditing(member)
    setForm({
      name: member.name,
      role: (member.role as Role) || 'garson',
      phone: member.phone ?? '',
      pin: member.pin ?? '',
      active: member.active,
    })
    setOpen(true)
  }

  function handleSave() {
    if (!form.name.trim()) {
      toast.error('Ad zorunludur')
      return
    }
    const data = {
      name: form.name.trim(),
      role: form.role,
      phone: form.phone.trim() || undefined,
      pin: form.pin.trim() || undefined,
      active: form.active,
    }
    startTransition(async () => {
      if (editing) {
        await updateStaff(editing.id, data)
        toast.success('Personel güncellendi')
      } else {
        await createStaff(data)
        toast.success('Personel eklendi')
      }
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="size-4" /> Personel Ekle
        </Button>
      </div>

      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Telefon</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                  Personel kaydı bulunmuyor.
                </TableCell>
              </TableRow>
            )}
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {ROLE_LABELS[member.role as Role] ?? member.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{member.phone ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={member.active ? 'default' : 'outline'}>
                    {member.active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(member)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(async () => {
                          await deleteStaff(member.id)
                          toast.success('Personel silindi')
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
            <DialogTitle>{editing ? 'Personel Düzenle' : 'Yeni Personel'}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Ad Soyad</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Rol</Label>
              <Select
                value={form.role}
                onValueChange={(v) => setForm({ ...form, role: v as Role })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Telefon</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>PIN (opsiyonel)</Label>
              <Input
                type="password"
                value={form.pin}
                onChange={(e) => setForm({ ...form, pin: e.target.value })}
                maxLength={6}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.active}
                onCheckedChange={(checked) => setForm({ ...form, active: checked })}
              />
              <Label>Aktif</Label>
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
