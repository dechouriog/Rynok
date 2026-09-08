import Link from 'next/link';
import { getProperties } from '@/lib/api';
import { PropertyCard } from './PropertyCard';

export async function RecentProperties() {
  const properties = await getProperties();
  const recent = properties.slice(0, 3);

  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-rynok-primary">Propiedades recientes</h2>
        <Link href="/properties" className="text-rynok-accent font-medium">
          Ver marketplace completo →
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="text-rynok-muted">Aún no hay propiedades publicadas.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recent.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </section>
  );
}