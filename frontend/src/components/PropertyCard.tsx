import Link from 'next/link';
import type { Property } from '@/lib/api';

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="block border rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
      data-testid="property-card"
    >
      <img
        src={property.imageUrl || '/placeholder-house.jpg'}
        alt={property.title}
        className="w-full h-40 object-cover"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{property.title}</h3>
        <p className="text-sm text-gray-500">{property.location}</p>
        <p className="mt-2 font-bold text-rynok-accent">{property.priceEth} ETH</p>
      </div>
    </Link>
  );
}