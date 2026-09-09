'use client';
import Link from 'next/link';
import { LayoutDashboard, Wallet, ReceiptText, PlusCircle } from 'lucide-react';

const ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallet', label: 'Mi wallet', icon: Wallet },
  { href: '/escrow', label: 'Escrow', icon: ReceiptText },
  { href: '/properties/new', label: 'Publicar', icon: PlusCircle },
];

export function DashboardSidebar({ active }: { active: string }) {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 py-10 pr-6 text-sm md:block">
      <nav className="space-y-1">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
              active === href ? 'bg-slate-100 font-medium text-slate-900' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
