import { getProperties } from '@/lib/api';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertySearchBar } from '@/components/PropertySearchBar';

export default async function PropertiesPage({
  searchParams,
}: { searchParams: { q?: string; location?: string } }) {
  const properties = await getProperties(searchParams);

  return (
    <>
      <PropertySearchBar />
      {properties.length === 0 ? (
        <p className="text-center text-gray-500">No se encontraron propiedades.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </>
  );
}