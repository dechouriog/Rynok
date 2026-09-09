import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Property } from '@/lib/api';

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 transition-shadow hover:shadow-lg"
      data-testid="property-card"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={property.imageUrl || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=60'}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-slate-900">{property.title}</h3>
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>{property.location}</span>
        </div>
        <div className="pt-1">
          <span className="text-lg font-bold text-slate-900">{property.priceEth} ETH</span>
        </div>
      </div>
    </Link>
  );
}
