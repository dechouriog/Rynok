import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, MapPin, ShieldCheck, User } from 'lucide-react';
import { getProperty, imageSrc } from '@/lib/api';
import { formatDate, formatEth, shortenAddress } from '@/lib/format';
import { DELIVERY_PERIOD_DAYS } from '@/lib/blockchain';
import { Card } from '@/components/ui';
import { PropertyImage } from '@/components/property/PropertyImage';
import { PropertyStatusBadge } from '@/components/property/StatusBadge';
import { PurchasePanel } from '@/components/escrow/PurchasePanel';

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const property = await getProperty(id).catch(() => null);
  if (!property) return { title: 'Propiedad no encontrada' };
  const description = `${formatEth(property.priceEth)} · ${property.location}. ${property.description.slice(0, 140)}`;
  return {
    title: property.title,
    description,
    openGraph: {
      title: property.title,
      description,
      images: imageSrc(property.imageUrl) ? [{ url: imageSrc(property.imageUrl) as string }] : undefined,
    },
  };
}

const STEPS = [
  'Depositas el precio exacto en el contrato de escrow.',
  'El vendedor no recibe el dinero hasta que confirmes la entrega.',
  `Si no hay entrega, recuperas tus fondos pasados ${DELIVERY_PERIOD_DAYS} días.`,
];

export default async function PropertyDetailPage({ params }: Params) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Link
        href="/properties"
        className="mb-6 inline-flex items-center gap-1 rounded-control text-sm text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a explorar
      </Link>

      <div className="grid gap-8 lg:grid-cols-3 lg:gap-10">
        <div className="lg:col-span-2">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card bg-surface-sunken">
            <PropertyImage
              src={property.imageUrl}
              alt={`Foto de ${property.title}`}
              sizes="(min-width: 1024px) 760px, 100vw"
              priority
            />
          </div>

          <section className="mt-8" aria-labelledby="descripcion">
            <h2 id="descripcion" className="text-lg font-semibold text-ink">
              Descripción
            </h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-ink-soft">{property.description}</p>
          </section>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-ink-muted" aria-hidden />
              <div>
                <dt className="text-sm text-ink-muted">Ubicación</dt>
                <dd className="font-medium text-ink">{property.location}</dd>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 text-ink-muted" aria-hidden />
              <div>
                <dt className="text-sm text-ink-muted">Publicada</dt>
                <dd className="font-medium text-ink">{formatDate(property.createdAt, false)}</dd>
              </div>
            </div>
          </dl>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start" aria-label="Compra">
          <Card className="p-6">
            <PropertyStatusBadge status={property.status} />
            <h1 className="mt-3 text-xl font-bold leading-snug text-ink sm:text-2xl">{property.title}</h1>
            <p className="mt-3 text-3xl font-bold text-ink">{formatEth(property.priceEth)}</p>
            <p className="mt-4 flex items-center gap-2 rounded-control bg-surface-muted p-3 text-sm text-ink-soft">
              <User className="h-4 w-4 shrink-0" aria-hidden />
              Publicada por{' '}
              <span className="font-mono" title={property.owner.walletAddress}>
                {shortenAddress(property.owner.walletAddress)}
              </span>
            </p>
            <div className="mt-5">
              <PurchasePanel property={property} />
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden /> Compra protegida por escrow
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-ink-soft">
              {STEPS.map((step, i) => (
                <li key={step} className="flex gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>
    </div>
  );
}
