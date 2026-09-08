import Link from 'next/link';
import { Home } from 'lucide-react';
import { ConnectWalletButton } from './ConnectWalletButton';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-4 bg-white border-b">
      <Link href="/" className="flex items-center gap-2">
        <span className="bg-rynok-primary text-white p-2 rounded-lg">
          <Home size={18} />
        </span>
        <span className="text-xl font-bold text-rynok-accent">Rynok</span>
      </Link>

      <div className="hidden md:flex gap-8 text-slate-600 font-medium">
        <Link href="/properties">Explorar</Link>
        <Link href="/properties">Marketplace</Link>
        <Link href="/properties/new">Publicar</Link>
        <Link href="/about">Nosotros</Link>
      </div>

      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-slate-600 font-medium hidden sm:block">
          Mi dashboard
        </Link>
        <ConnectWalletButton />
      </div>
    </nav>
  );
}