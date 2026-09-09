import { ArrowLeft, MapPin, User } from 'lucide-react';
import Link from 'next/link';
import { getProperty } from '@/lib/api';
import { PropertyOwnerActions } from '@/components/PropertyOwnerActions';
import { BuyButton } from '@/components/BuyButton';

function shorten(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/properties" className="mb-6 flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Volver a explorar
      </Link>

      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="aspect-[16/9] w-full overflow-hidden rounded-xl bg-slate-100">
            <img
              src={property.imageUrl || 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1000&q=60'}
              alt={property.title}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Descripción</h2>
            <p className="mt-2 text-slate-600">{property.description}</p>
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-semibold text-slate-900">Ubicación</h2>
            <div className="mt-2 flex items-center gap-2 text-slate-600">
              <MapPin className="h-4 w-4" /> {property.location}
            </div>
          </div>
        </div>

        <aside className="h-fit rounded-xl border border-slate-200 p-6">
          <h1 className="text-xl font-bold text-slate-900">{property.title}</h1>
          <div className="mt-4">
            <div className="text-3xl font-bold text-slate-900">{property.priceEth} ETH</div>
          </div>

          <div className="mt-5 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
            <User className="h-4 w-4" /> Publicado por {shorten(property.owner.walletAddress)}
          </div>

          <BuyButton />

          <p className="mt-3 text-center text-xs text-slate-400">
            La compra en ETH con escrow llega en la próxima entrega. Por ahora puedes explorar y publicar propiedades.
          </p>

          <PropertyOwnerActions property={property} />
        </aside>
      </div>
    </div>
  );
}
