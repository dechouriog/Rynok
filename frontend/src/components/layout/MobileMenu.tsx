'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { MAIN_NAV, ACCOUNT_NAV, isActive } from './nav-items';

/** Menú desplegable para pantallas pequeñas. Se cierra al navegar o con Escape. */
export function MobileMenu() {
  const pathname = usePathname();
  const [openFor, setOpenFor] = useState<string | null>(null);
  const open = openFor === pathname; // se cierra solo al cambiar de ruta

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpenFor(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpenFor(open ? null : pathname)}
        aria-expanded={open}
        aria-controls="menu-movil"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        className="flex h-10 w-10 items-center justify-center rounded-control text-ink hover:bg-surface-sunken"
      >
        {open ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
      </button>
      {open && (
        <nav
          id="menu-movil"
          aria-label="Menú móvil"
          className="absolute inset-x-0 top-16 z-40 animate-fade-in border-b border-line bg-surface px-4 pb-4 pt-2 shadow-raised"
        >
          {[
            { title: 'Marketplace', items: MAIN_NAV },
            { title: 'Mi cuenta', items: ACCOUNT_NAV },
          ].map((group) => (
            <div key={group.title} className="py-2">
              <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">{group.title}</p>
              <ul>
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active = isActive(pathname, href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex items-center gap-3 rounded-control px-3 py-3 text-sm font-medium',
                          active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-surface-sunken',
                        )}
                      >
                        <Icon className="h-4 w-4" aria-hidden /> {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      )}
    </div>
  );
}
