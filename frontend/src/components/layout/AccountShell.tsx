'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { ACCOUNT_NAV, isActive } from './nav-items';

/**
 * Estructura de las páginas de cuenta: barra lateral en escritorio y pestañas desplazables en móvil
 * (antes la navegación desaparecía por completo en pantallas pequeñas).
 */
export function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:flex md:gap-10 md:py-10">
      <nav
        aria-label="Mi cuenta"
        className="-mx-4 mb-6 overflow-x-auto border-b border-line px-4 md:mx-0 md:mb-0 md:w-56 md:shrink-0 md:border-0 md:px-0"
      >
        <ul className="flex gap-1 md:sticky md:top-24 md:flex-col">
          {ACCOUNT_NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-2 whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors',
                    'border-b-2 md:rounded-control md:border-b-0',
                    active
                      ? 'border-brand-600 text-brand-700 md:bg-brand-50'
                      : 'border-transparent text-ink-soft hover:text-ink md:hover:bg-surface-sunken',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden /> {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
