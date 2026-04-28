'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Archive,
  Calendar,
  Database,
  FileBarChart,
  LayoutDashboard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from 'lucide-react';
import { ChatDock } from '@/components/chat-dock';
import powerBiLogo from '../../assestimages/New_Power_BI_Logo.svg.png';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/datasets', label: 'Datasets', icon: Database },
  { href: '/reports/new', label: 'New report', icon: FileBarChart },
  { href: '/archive', label: 'Archive', icon: Archive },
  { href: '/schedules', label: 'Schedules', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function AppShellClient({
  children,
  token,
}: {
  children: React.ReactNode;
  token: string;
}) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('powerai.sidebar.collapsed');
    setCollapsed(saved === 'true');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('powerai.sidebar.collapsed', String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <aside
        className={[
          'fixed inset-y-0 left-0 z-30 hidden border-r border-neutral-200 bg-white transition-all duration-300 md:flex md:flex-col',
          collapsed ? 'w-[74px]' : 'w-56',
        ].join(' ')}
      >
        <div className="border-b border-neutral-100 px-3 py-4">
          <div className={['flex items-center', collapsed ? 'justify-center' : 'justify-between'].join(' ')}>
            <Link
              href="/dashboard"
              className={['flex items-center', collapsed ? '' : 'gap-2'].join(' ')}
              title="Power AI"
            >
              <Image
                src={powerBiLogo}
                alt="Power BI logo"
                width={18}
                height={18}
                className="h-[18px] w-[18px] object-contain"
              />
              {!collapsed && <p className="text-sm font-bold tracking-wide text-black">Power AI</p>}
            </Link>

            {!collapsed && (
              <button
                type="button"
                aria-label="Collapse sidebar"
                onClick={() => setCollapsed(true)}
                className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {collapsed && (
            <div className="mt-3 flex justify-center">
              <button
                type="button"
                aria-label="Expand sidebar"
                onClick={() => setCollapsed(false)}
                className="inline-flex h-8 w-8 items-center justify-center border border-neutral-200 text-neutral-600 hover:bg-neutral-100"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname?.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={[
                  'flex items-center border px-3 py-2 text-sm transition-colors',
                  collapsed ? 'justify-center' : 'gap-2',
                  active
                    ? 'border-neutral-300 bg-neutral-100 text-neutral-900'
                    : 'border-transparent text-neutral-700 hover:border-neutral-200 hover:bg-neutral-100',
                ].join(' ')}
              >
                <Icon className="h-4 w-4 shrink-0 text-neutral-500" />
                {!collapsed && <span>{label}</span>}
              </Link>
            );
          })}
        </nav>

        <form className="border-t border-neutral-100 p-3" action="/auth/signout" method="post">
          <button
            type="submit"
            title={collapsed ? 'Sign out' : undefined}
            className={[
              'w-full border px-3 py-2 text-sm text-neutral-600 transition-colors hover:bg-neutral-50',
              collapsed ? 'flex items-center justify-center' : 'text-left',
            ].join(' ')}
          >
            {collapsed ? <LogOut className="h-4 w-4" /> : 'Sign out'}
          </button>
        </form>
      </aside>

      <div className={['transition-all duration-300', collapsed ? 'md:pl-[74px]' : 'md:pl-56'].join(' ')}>
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/80 backdrop-blur md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-semibold">Analytics</span>
            <Link href="/dashboard" className="text-sm text-neutral-600">
              Menu
            </Link>
          </div>
        </header>
        <main className="w-full px-6 py-8">{children}</main>
      </div>

      <ChatDock token={token} />
    </div>
  );
}

