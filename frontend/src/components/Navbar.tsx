import Link from 'next/link';
import { ConnectWalletButton } from '@/src/components/ConnectWalletButton';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-rynok-primary text-white">
      <Link href="/" className="text-xl font-bold">
        Rynok
      </Link>

      <div className="flex items-center gap-4">
        <Link href="/properties">Explorar</Link>
        <Link href="/properties/new">Publicar</Link>
        <ConnectWalletButton />
      </div>
    </nav>
  );
}

