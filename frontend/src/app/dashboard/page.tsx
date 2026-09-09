'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Home, Wallet } from 'lucide-react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useWallet } from '@/context/WalletContext';
import { getProperties, type Property } from '@/lib/api';

function shorten(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function DashboardPage() {
  const { address, profile, connect } = useWallet();
  const [myProperties, setMyProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) {
      setLoading(false);
      return;
    }
    getProperties()
      .then((all) => setMyProperties(all.filter((p) => p.owner.id === profile.id)))
      .finally(() => setLoading(false));
  }, [profile]);

  if (!address) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Wallet className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <p className="mb-4 text-slate-600">Conecta tu wallet para ver tu dashboard.</p>
        <button onClick={connect} className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Conectar wallet
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl">
      <DashboardSidebar active="/dashboard" />
      <div className="flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {shorten(address)} 👋
        </h1>
        <p className="mt-1 text-slate-500">Este es el resumen de tu actividad en Rynok.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-400">
              <Home className="h-4 w-4" /> Mis propiedades
            </div>
            <div className="mt-2 text-2xl font-bold text-slate-900">{myProperties.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 text-xs font-medium uppercase text-slate-400">
              <Wallet className="h-4 w-4" /> Wallet
            </div>
            <div className="mt-2 text-2xl font-bold text-emerald-600">Conectada</div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 font-semibold text-slate-900">Mis propiedades</h2>
          {loading ? (
            <p className="text-sm text-slate-400">Cargando...</p>
          ) : myProperties.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aún no has publicado ninguna propiedad.{' '}
              <Link href="/properties/new" className="text-brand-600 hover:underline">Publica la primera</Link>.
            </p>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4 text-sm">
              <table className="w-full text-left">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="pb-2">Título</th>
                    <th className="pb-2">Ubicación</th>
                    <th className="pb-2">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myProperties.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2">
                        <Link href={`/properties/${p.id}`} className="hover:text-brand-600">{p.title}</Link>
                      </td>
                      <td className="py-2">{p.location}</td>
                      <td className="py-2">{p.priceEth} ETH</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
