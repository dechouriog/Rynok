import Link from 'next/link';
import { Logo } from './layout/Logo';
import { ResetOnboardingButton } from './ResetOnboardingButton';

const COLUMNS = [
  {
    title: 'Marketplace',
    links: [
      { href: '/properties', label: 'Explorar propiedades' },
      { href: '/properties/new', label: 'Publicar propiedad' },
    ],
  },
  {
    title: 'Mi cuenta',
    links: [
      { href: '/dashboard', label: 'Mi panel' },
      { href: '/escrow', label: 'Compras y ventas' },
      { href: '/wallet', label: 'Mi wallet' },
    ],
  },
  {
    title: 'Rynok',
    links: [{ href: '/about', label: 'Cómo funciona el escrow' }],
  },
];

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-surface-muted">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-ink-muted">
            Marketplace inmobiliario donde publicas tu propiedad y la vendes en ETH, con el pago protegido por un smart
            contract de escrow.
          </p>
        </div>
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h2 className="text-sm font-semibold text-ink">{column.title}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-ink-muted hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
              {column.title === 'Rynok' && (
                <li>
                  <ResetOnboardingButton />
                </li>
              )}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line px-4 py-6 text-center text-xs text-ink-muted">
        © 2026 Rynok · Proyecto académico. No constituye asesoría financiera ni legal.
      </div>
    </footer>
  );
}
