import type { Metadata } from 'next';
import { Home, Search } from 'lucide-react';
import { ButtonLink } from '@/components/ui';

export const metadata: Metadata = { title: 'Página no encontrada' };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Error 404</p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-ink sm:text-4xl">No encontramos esta página</h1>
      <p className="mt-4 text-ink-muted">Puede que la propiedad se haya eliminado o que el enlace esté mal escrito.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/properties" icon={<Search className="h-4 w-4" aria-hidden />}>
          Explorar propiedades
        </ButtonLink>
        <ButtonLink href="/" variant="outline" icon={<Home className="h-4 w-4" aria-hidden />}>
          Ir al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
