import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SearchX } from 'lucide-react';
import { getProperties } from '@/lib/api';
import { parseFilters, type SearchParams } from '@/lib/filters';
import { PropertyCard } from '@/components/PropertyCard';
import { PropertyFilters } from '@/components/PropertyFilters';
import { Pagination } from '@/components/Pagination';
import { PageHeader } from '@/components/PageHeader';
import { ButtonLink, EmptyState } from '@/components/ui';

export const metadata: Metadata = {
  title: 'Explorar propiedades',
  description: 'Busca propiedades por ciudad y precio en ETH. Compra con el pago protegido por escrow.',
};

const PAGE_SIZE = 9;

export default async function PropertiesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const filters = parseFilters(await searchParams);
  const result = await getProperties({ ...filters, limit: PAGE_SIZE });
  const { page, ...linkParams } = filters;
  const hasFilters = Boolean(filters.q || filters.location || filters.minPrice || filters.maxPrice);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="Explorar propiedades"
        description="Filtra por ciudad y precio en ETH, y ordena por lo que más te importe."
      />

      <Suspense>
        <PropertyFilters />
      </Suspense>

      <p className="mt-6 text-sm text-ink-muted" aria-live="polite">
        {result.total === 1 ? '1 propiedad' : `${result.total} propiedades`}
        {result.totalPages > 1 && ` · página ${result.page} de ${result.totalPages}`}
      </p>

      {result.items.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={<SearchX />}
          title={hasFilters ? 'No hay propiedades con esos filtros' : 'Aún no hay propiedades publicadas'}
          description={
            hasFilters
              ? 'Prueba con otra ciudad o un rango de precio más amplio.'
              : 'Sé la primera persona en publicar.'
          }
          action={
            hasFilters ? (
              <ButtonLink href="/properties" variant="outline">
                Ver todas
              </ButtonLink>
            ) : (
              <ButtonLink href="/properties/new">Publicar propiedad</ButtonLink>
            )
          }
        />
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {result.items.map((p, i) => (
            <PropertyCard key={p.id} property={p} priority={i < 3} />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={result.totalPages}
        params={linkParams as Record<string, string | undefined>}
      />
    </div>
  );
}
