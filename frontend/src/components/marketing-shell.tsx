import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import powerBiLogo from '../../assestimages/New_Power_BI_Logo.svg.png';

const nav = [
  { href: '/features', label: 'Features' },
  { href: '/workflow', label: 'Workflow' },
  { href: '/exports', label: 'Exports' },
  { href: '/security', label: 'Security' },
  { href: '/faq', label: 'FAQ' },
];

export function MarketingShell({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,rgba(34,211,238,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_20%_20%,rgba(168,85,247,0.12),transparent_55%)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,rgba(34,211,238,0.35)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,211,238,0.35)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/70 backdrop-blur">
        <div className="flex w-full items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-6 w-6 items-center justify-center">
              <Image
                src={powerBiLogo}
                alt="Power BI logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight"></p>
              <p className="text-xs text-muted">Power AI</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const isActive = active === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    'rounded-lg px-3 py-2 text-sm font-medium',
                    isActive
                      ? 'bg-card text-foreground shadow-soft'
                      : 'text-muted hover:bg-card hover:text-foreground',
                  ].join(' ')}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-card hover:text-foreground"
            >
              Sign in
            </Link>
            <Link href="/login">
              <Button className="rounded-full px-5">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}

