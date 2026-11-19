import Link from 'next/link';
import { MapPin } from 'lucide-react';
import type { Property } from '@/lib/api';
import { formatEth } from '@/lib/format';
import { PropertyImage } from './property/PropertyImage';
import { PropertyStatusBadge } from './property/StatusBadge';

export function PropertyCard({ property, priority }: { property: Property; priority?: boolean }) {
  return (
    <article
      data-testid="property-card"
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-raised"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-sunken">
        <PropertyImage
          src={property.imageUrl}
          alt={`Foto de ${property.title}`}
          sizes="(min-width: 1024px) 360px, (min-width: 640px) 50vw, 100vw"
          priority={priority}
          className="transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3">
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="line-clamp-1 font-semibold text-ink">
          {/* El enlace cubre toda la tarjeta, pero el nombre accesible es solo el título */}
          <Link
            href={`/properties/${property.id}`}
            className="after:absolute after:inset-0 focus-visible:outline-none group-focus-within:underline"
          >
            {property.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1 text-sm text-ink-muted">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="line-clamp-1">{property.location}</span>
        </p>
        <p className="mt-auto pt-2 text-lg font-bold text-ink">{formatEth(property.priceEth)}</p>
      </div>
    </article>
  );
}
