import Link from 'next/link';
import { ArrowRight, CloudOff, Home } from 'lucide-react';
import { ApiError, getProperties, type Page, type Property } from '@/lib/api';
import { ButtonLink, EmptyState } from '@/components/ui';
import { PropertyCard } from './PropertyCard';

/** Últimas publicaciones. Si la API no responde, la portada sigue funcionando y lo explica. */
export async function RecentProperties() {
  let page: Page<Property> | null = null;
  let failed = false;
  try {
    page = await getProperties({ limit: 3 });
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    failed = true;
  }

  return (
    <section className="py-16 sm:py-20" aria-labelledby="recientes">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex items-end justify-between gap-4">
          <h2 id="recientes" className="text-2xl font-bold tracking-tight text-ink">
            Propiedades recientes
          </h2>
          <Link
            href="/properties"
            className="hidden items-center gap-1 text-sm font-semibold text-brand-600 hover:underline sm:inline-flex"
          >
            Ver todas <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        {failed ? (
          <EmptyState
            icon={<CloudOff />}
            title="No pudimos cargar las propiedades"
            description="El servidor de Rynok no responde en este momento. Inténtalo de nuevo en unos minutos."
          />
        ) : !page || page.items.length === 0 ? (
          <EmptyState
            icon={<Home />}
            title="Aún no hay propiedades publicadas"
            description="Publica la primera y aparecerá aquí."
            action={<ButtonLink href="/properties/new">Publicar propiedad</ButtonLink>}
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {page.items.map((p, i) => (
                <PropertyCard key={p.id} property={p} priority={i === 0} />
              ))}
            </div>
            <ButtonLink href="/properties" variant="outline" fullWidth className="mt-6 sm:hidden">
              Ver todas las propiedades
            </ButtonLink>
          </>
        )}
      </div>
    </section>
  );
}
