import { getProperties } from '@/lib/api';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyFilters } from '@/components/PropertyFilters';

type SearchParams = {
  q?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: 'recent' | 'price_asc' | 'price_desc';
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const filters = await searchParams;
  const properties = await getProperties(filters);

  const sorted = [...properties].sort((a, b) => {
    if (filters.sort === 'price_asc') return Number(a.priceEth) - Number(b.priceEth);
    if (filters.sort === 'price_desc') return Number(b.priceEth) - Number(a.priceEth);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Explorar propiedades</h1>
      <p className="mt-1 text-slate-500">Filtra por ubicación, precio en ETH y ordena por lo que más te importe.</p>

      <PropertyFilters />

      {sorted.length === 0 ? (
        <p className="mt-8 text-slate-500">No se encontraron propiedades.</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}
