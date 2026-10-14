import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { formatEth, imageSrc, type Property } from '@/lib/api';

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  IN_ESCROW: { label: 'En escrow', className: 'bg-amber-100 text-amber-700' },
  SOLD: { label: 'Vendida', className: 'bg-slate-900 text-white' },
};

export function PropertyCard({ property }: { property: Property }) {
  const badge = STATUS_BADGE[property.status ?? ''];

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group block overflow-hidden rounded-xl border border-slate-200 transition-shadow hover:shadow-lg"
      data-testid="property-card"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={imageSrc(property.imageUrl)}
          alt={property.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {badge && (
          <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}>
            {badge.label}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <h3 className="line-clamp-1 font-semibold text-slate-900">{property.title}</h3>
        <div className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          <span>{property.location}</span>
        </div>
        <div className="pt-1">
          <span className="text-lg font-bold text-slate-900">{formatEth(property.priceEth)} ETH</span>
        </div>
      </div>
    </Link>
  );
}
