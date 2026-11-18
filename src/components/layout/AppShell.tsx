'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from './nav-items';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { signOut } from '@/features/auth/actions';

export default function AppShell({ profile, children }: { profile: any; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavList = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link key={href} href={href} onClick={onNavigate}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-ring',
              active ? 'bg-surface text-ink' : 'text-mute hover:bg-surface/50 hover:text-ink',
            )}>
            <Icon size={18} /> {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-base">
      {/* Desktop left sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col gap-4 border-r border-line bg-panel p-4 lg:flex">
        <Link href="/home" className="flex items-center gap-2 px-2">
          <span className="text-lg font-semibold tracking-tight">AVORA</span>
        </Link>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <NavList />
        </div>
        <div className="flex items-center gap-3 border-t border-line pt-4">
          <Avatar name={profile?.display_name} src={profile?.avatar_url} size={32} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ink">{profile?.display_name}</p>
            <p className="muted truncate text-xs">@{profile?.username}</p>
          </div>
          <Button size="icon" variant="ghost" onClick={signOut} title="Sign out">←</Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-panel/90 p-3 backdrop-blur lg:hidden">
        <Link href="/home" className="text-lg font-semibold tracking-tight">AVORA</Link>
        <button className="rounded-md p-2 focus-ring" aria-label="Menu" onClick={() => setMobileOpen((v) => !v)}>
          <Menu size={20} />
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col gap-4 border-r border-line bg-panel p-4"
            onClick={(e) => e.stopPropagation()}>
            <p className="px-2 text-lg font-semibold tracking-tight">AVORA</p>
            <NavList onNavigate={() => setMobileOpen(false)} />
            <div className="mt-auto flex items-center gap-3 border-t border-line pt-4">
              <Avatar name={profile?.display_name} src={profile?.avatar_url} size={32} />
              <div className="flex-1">
                <p className="text-sm">{profile?.display_name}</p>
                <p className="muted text-xs">@{profile?.username}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={signOut}>Sign out</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main */}
      <main className="mx-auto w-full max-w-3xl px-4 py-6 lg:pl-64 lg:pr-6">{children}</main>
    </div>
  );
}