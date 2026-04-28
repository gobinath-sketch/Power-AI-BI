import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppShellClient } from '@/components/app-shell-client';

export async function AppShell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  return <AppShellClient token={session.access_token}>{children}</AppShellClient>;
}
