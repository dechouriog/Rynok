import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClasses } from '@/components/ui/Button';

type PaginationProps = {
  page: number;
  totalPages: number;
  /** Parámetros actuales de la URL, para conservar filtros y orden. */
  params: Record<string, string | undefined>;
  basePath?: string;
};

function hrefFor(basePath: string, params: PaginationProps['params'], page: number) {
  const search = new URLSearchParams(
    Object.entries({ ...params, page: page > 1 ? String(page) : undefined }).filter((e): e is [string, string] =>
      Boolean(e[1]),
    ),
  ).toString();
  return `${basePath}${search ? `?${search}` : ''}`;
}

/** Paginación con enlaces reales (funciona sin JavaScript y es indexable). */
export function Pagination({ page, totalPages, params, basePath = '/properties' }: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
  );

  return (
    <nav aria-label="Paginación" className="mt-10 flex items-center justify-center gap-1">
      {page > 1 ? (
        <Link href={hrefFor(basePath, params, page - 1)} className={buttonClasses('ghost', 'sm')} rel="prev">
          <ChevronLeft className="h-4 w-4" aria-hidden /> <span className="hidden sm:inline">Anterior</span>
        </Link>
      ) : (
        <span className={buttonClasses('ghost', 'sm', 'pointer-events-none opacity-40')} aria-hidden>
          <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Anterior</span>
        </span>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center">
          {i > 0 && pages[i - 1] !== p - 1 && <span className="px-1 text-ink-muted">…</span>}
          <Link
            href={hrefFor(basePath, params, p)}
            aria-current={p === page ? 'page' : undefined}
            aria-label={`Página ${p}`}
            className={cn(buttonClasses(p === page ? 'primary' : 'ghost', 'sm'), 'min-w-9')}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < totalPages ? (
        <Link href={hrefFor(basePath, params, page + 1)} className={buttonClasses('ghost', 'sm')} rel="next">
          <span className="hidden sm:inline">Siguiente</span> <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span className={buttonClasses('ghost', 'sm', 'pointer-events-none opacity-40')} aria-hidden>
          <span className="hidden sm:inline">Siguiente</span> <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}
