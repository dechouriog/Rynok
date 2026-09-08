import Link from 'next/link';
import { Home } from 'lucide-react';

export function Hero() {
  return (
    <section className="bg-rynok-surface text-center py-24 px-6">
      <div className="inline-flex bg-rynok-primary text-white p-4 rounded-2xl mb-6">
        <Home size={32} />
      </div>
      <h1 className="text-4xl md:text-5xl font-extrabold text-rynok-primary max-w-3xl mx-auto leading-tight">
        Bienes raíces, comprados y vendidos en cripto
      </h1>
      <p className="text-rynok-muted max-w-xl mx-auto mt-6 text-lg">
        Publica tu propiedad, o compra la de alguien más, directamente en ETH desde MetaMask.
        Cada transacción queda protegida por un smart contract de escrow.
      </p>
      <div className="flex justify-center gap-4 mt-8">
        <Link href="/properties" className="bg-rynok-primary text-white px-6 py-3 rounded-lg font-medium">
          Explorar propiedades
        </Link>
        <Link href="/properties/new" className="border border-slate-300 px-6 py-3 rounded-lg font-medium">
          Publicar mi propiedad
        </Link>
      </div>
    </section>
  );
}