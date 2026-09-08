import { getProperties } from '@/lib/api';
import { PropertyCard } from '@/components/PropertyCard';

export default async function PropertiesPage() {
  const properties = await getProperties();

  if (properties.length === 0) {
    return <p className="text-center text-gray-500">Aún no hay propiedades publicadas.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((p) => <PropertyCard key={p.id} property={p} />)}
    </div>
  );
}