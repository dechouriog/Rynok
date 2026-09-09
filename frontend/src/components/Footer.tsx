import Link from 'next/link';

export function Footer() {
  return (
    <footer className="mt-10 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="text-lg font-extrabold text-slate-900">Rynok</div>
          <p className="mt-3 max-w-xs text-sm text-slate-500">
            Marketplace inmobiliario donde cualquier persona publica su propiedad y la vende
            directamente en ETH, protegida por un smart contract de escrow.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Producto</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/properties" className="hover:text-slate-900">Explorar propiedades</Link></li>
            <li><Link href="/properties" className="hover:text-slate-900">Marketplace</Link></li>
            <li><Link href="/properties/new" className="hover:text-slate-900">Publicar propiedad</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Cuenta</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/dashboard" className="hover:text-slate-900">Dashboard</Link></li>
            <li><Link href="/wallet" className="hover:text-slate-900">Mi wallet</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">Compañía</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><Link href="/about" className="hover:text-slate-900">Sobre Rynok</Link></li>
            <li><Link href="/escrow" className="hover:text-slate-900">Cómo funciona el escrow</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        © 2026 Rynok. Proyecto académico — no es asesoría financiera ni legal.
      </div>
    </footer>
  );
}
