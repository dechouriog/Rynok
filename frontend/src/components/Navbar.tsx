import Link from 'next/link';
import { Home } from 'lucide-react';
import { ConnectWalletButton } from './ConnectWalletButton';

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold text-brand-600">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Home className="h-4 w-4" />
          </span>
          Rynok
        </Link>

        <nav className="hidden items-center gap-6 text-sm md:flex">
          <Link href="/properties" className="text-slate-600 hover:text-slate-900">Explorar</Link>
          <Link href="/properties" className="text-slate-600 hover:text-slate-900">Marketplace</Link>
          <Link href="/properties/new" className="text-slate-600 hover:text-slate-900">Publicar</Link>
          <Link href="/about" className="text-slate-600 hover:text-slate-900">Nosotros</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 sm:block">
            Mi dashboard
          </Link>
          <ConnectWalletButton />
        </div>
      </div>
    </header>
  );
}
