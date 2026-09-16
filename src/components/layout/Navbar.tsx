'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  LogOut,
  LayoutDashboard,
  Ticket,
  MapPin,
  ShoppingCart,
  UserRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/book', label: 'Book Ticket', icon: ShoppingCart },
  { href: '/dashboard/tickets', label: 'My Tickets', icon: Ticket },
  { href: '/dashboard/routes', label: 'Routes', icon: MapPin },
];

export function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Logo size="sm" href="/dashboard" />
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-[#F37021] text-white shadow-sm dark:bg-[#F37021] dark:text-white'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  )}
                >
                  <Icon size={16} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" className="flex items-center gap-2" />
                }
              >
                <div className="h-9 w-9 overflow-hidden rounded-full bg-gradient-to-br from-[#F37021] to-[#E85D0A] flex items-center justify-center">
                  {session.user.image ? (
                    <img src={session.user.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <UserRound size={19} className="text-white" strokeWidth={1.5} />
                  )}
                </div>
                <span className="hidden sm:inline text-sm font-medium">
                  {session.user.name}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 overflow-hidden rounded-full bg-gradient-to-br from-[#F37021] to-[#E85D0A] flex items-center justify-center">
                      {session.user.image ? <img src={session.user.image} alt="" className="h-full w-full object-cover" /> : <UserRound size={23} className="text-white" strokeWidth={1.5} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{session.user.name}</p>
                      <p className="truncate text-xs text-slate-500">{session.user.email}</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">ID: {session.user.studentId}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Link href="/dashboard/profile" className="flex items-center gap-2 cursor-pointer w-full">
                    <UserRound size={14} /> My Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut size={14} className="mr-2" /> Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button variant="ghost" size="icon" className="md:hidden" />
              }
            >
              <Menu size={20} />
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <div className="mt-6">
                <Logo size="sm" href="/dashboard" />
                <nav className="mt-8 flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-[#F37021] text-white shadow-sm dark:bg-[#F37021] dark:text-white'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                        )}
                      >
                        <Icon size={18} />
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
