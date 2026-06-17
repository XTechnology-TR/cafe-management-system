'use client'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { authClient } from '@/lib/auth-client'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Boxes,
  ChefHat,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  type LucideIcon,
  Menu,
  QrCode,
  Truck,
  Users,
  UtensilsCrossed,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

type NavItem = { title: string; href: string; icon: LucideIcon }

const operations: NavItem[] = [
  { title: 'Genel Bakış', href: '/', icon: LayoutDashboard },
  { title: 'Kasa / POS', href: '/pos', icon: CreditCard },
  { title: 'Mutfak Ekranı', href: '/kitchen', icon: ChefHat },
  { title: 'Paket & Gel-Al', href: '/delivery', icon: Truck },
  { title: 'Masalar', href: '/tables', icon: UtensilsCrossed },
]

const management: NavItem[] = [
  { title: 'Menü Yönetimi', href: '/menu', icon: Menu },
  { title: 'QR Menü', href: '/qr-menu', icon: QrCode },
  { title: 'Stok Takibi', href: '/inventory', icon: Boxes },
  { title: 'Personel', href: '/staff', icon: Users },
]

const finance: NavItem[] = [
  { title: 'Muhasebe', href: '/accounting', icon: ClipboardList },
  { title: 'Raporlar', href: '/reports', icon: BarChart3 },
]

export function AppSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push('/sign-in')
    router.refresh()
  }

  function renderGroup(label: string, items: NavItem[]) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>{label}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            {items.map((item) => {
              const active = pathname === item.href
              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton render={<Link href={item.href} />} isActive={active}>
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  const initials = user.name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <ChefHat className="size-5" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-sidebar-foreground">RestoPanel</span>
            <span className="text-xs text-sidebar-foreground/60">Yönetim Sistemi</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup('Operasyon', operations)}
        {renderGroup('Yönetim', management)}
        {renderGroup('Finans', finance)}
      </SidebarContent>
      <SidebarFooter>
        <DropdownMenu>
          <DropdownMenuTrigger
            className={cn(
              'flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors',
              'hover:bg-sidebar-accent',
            )}
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
              {initials || 'RP'}
            </div>
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-sm font-medium text-sidebar-foreground">
                {user.name}
              </span>
              <span className="truncate text-xs text-sidebar-foreground/60">
                {user.email}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="size-4" />
              Çıkış Yap
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
