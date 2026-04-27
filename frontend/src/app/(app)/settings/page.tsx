import { createClient } from '@/lib/supabase/server';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <p className="mt-1 text-sm text-neutral-600">Account and integration overview.</p>

      <div className="mt-8 space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 text-sm shadow-soft">
        <div>
          <p className="text-xs font-medium uppercase text-neutral-500">User ID</p>
          <p className="mt-1 font-mono text-xs break-all">{user?.id}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-neutral-500">Email</p>
          <p className="mt-1">{user?.email}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-neutral-500">API</p>
          <p className="mt-1 text-neutral-600">
            Frontend talks to <code className="rounded bg-neutral-100 px-1">NEXT_PUBLIC_API_BASE</code>.
            Power BI credentials never leave the NestJS server.
          </p>
        </div>
      </div>
    </div>
  );
}
