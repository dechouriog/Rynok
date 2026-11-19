'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';
import { MAIN_NAV, ACCOUNT_NAV, isActive } from './nav-items';

/** Enlaces del menú de escritorio con estado activo (aria-current). */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
      {[...MAIN_NAV, ACCOUNT_NAV[0]].map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-control px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink',
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
