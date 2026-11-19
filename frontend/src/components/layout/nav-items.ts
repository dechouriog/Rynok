import { Info, LayoutDashboard, PlusCircle, ReceiptText, Search, Wallet, type LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon };

/** Navegación pública principal. */
export const MAIN_NAV: NavItem[] = [
  { href: '/properties', label: 'Explorar', icon: Search },
  { href: '/properties/new', label: 'Publicar', icon: PlusCircle },
  { href: '/about', label: 'Cómo funciona', icon: Info },
];

/** Secciones de la cuenta (dashboard). */
export const ACCOUNT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Mi panel', icon: LayoutDashboard },
  { href: '/escrow', label: 'Compras y ventas', icon: ReceiptText },
  { href: '/wallet', label: 'Mi wallet', icon: Wallet },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === '/properties') return pathname === '/properties' || /^\/properties\/(?!new)[^/]+/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}
