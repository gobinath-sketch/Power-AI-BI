import Link from 'next/link';
import { LayoutDashboard, Database, FileBarChart, Calendar, Archive, Settings } from 'lucide-react';
import { ChatDock } from '@/components/chat-dock';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/datasets', label: 'Datasets', icon: Database },
  { href: '/reports/new', label: 'New report', icon: FileBarChart },
  { href: '/archive', label: 'Archive', icon: Archive },
  { href: '/schedules', label: 'Schedules', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 border-r border-neutral-200 bg-white md:flex md:flex-col">
        <div className="border-b border-neutral-100 px-5 py-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Power BI
          </p>
          <p className="text-lg font-semibold text-neutral-900">Analytics</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              <Icon className="h-4 w-4 text-neutral-500" />
              {label}
            </Link>
          ))}
        </nav>
        <form
          className="border-t border-neutral-100 p-3"
          action="/auth/signout"
          method="post"
        >
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-neutral-600 hover:bg-neutral-50"
          >
            Sign out
          </button>
        </form>
      </aside>
      <div className="md:pl-56">
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
      <ChatDock token={session.access_token} />
    </div>
  );
}
