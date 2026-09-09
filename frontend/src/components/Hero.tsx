import Link from 'next/link';
import { Home } from 'lucide-react';

export function Hero() {
  return (
    <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white">
          <Home className="h-8 w-8" />
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          Bienes raíces, comprados y vendidos en cripto
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
          Publica tu propiedad, o compra la de alguien más, directamente en ETH desde MetaMask.
          Cada transacción queda protegida por un smart contract de escrow.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/properties" className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
            Explorar propiedades
          </Link>
          <Link href="/properties/new" className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Publicar mi propiedad
          </Link>
        </div>
      </div>
    </div>
  );
}
