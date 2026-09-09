import Link from 'next/link';
import { getProperties } from '@/lib/api';
import { PropertyCard } from './PropertyCard';

export async function RecentProperties() {
  const properties = await getProperties();
  const recent = properties.slice(0, 3);

  return (
    <div className="py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 flex items-end justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Propiedades recientes</h2>
          <Link href="/properties" className="text-sm font-medium text-brand-600 hover:underline">
            Ver marketplace completo →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-slate-500">Aún no hay propiedades publicadas.</p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}
