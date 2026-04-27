import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

async function main() {
  const url = process.env.SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const email = process.env.SMOKE_EMAIL!;
  const password = process.env.SMOKE_PASSWORD!;

  if (!url || !service) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  if (!email || !password) throw new Error('Missing SMOKE_EMAIL or SMOKE_PASSWORD');

  const supabase = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: listErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listErr) throw listErr;

  const found = existing.users.find((u) => (u.email ?? '').toLowerCase() === email.toLowerCase());

  if (!found) {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) throw error;
    // eslint-disable-next-line no-console
    console.log('Created user:', data.user?.id);
    return;
  }

  const { error: updErr } = await supabase.auth.admin.updateUserById(found.id, {
    password,
    email_confirm: true,
  });
  if (updErr) throw updErr;
  // eslint-disable-next-line no-console
  console.log('Updated user password:', found.id);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

