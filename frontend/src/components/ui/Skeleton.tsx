import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

/** Bloque de carga con las mismas dimensiones que el contenido final, para evitar saltos de layout. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div aria-hidden className={cn('animate-shimmer rounded-control bg-surface-sunken', className)} {...props} />;
}

/** Anuncia la carga una sola vez a lectores de pantalla. */
export function LoadingRegion({ label = 'Cargando…', children }: { label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
