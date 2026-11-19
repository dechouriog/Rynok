'use client';
import { useEffect } from 'react';
import { CloudOff, RotateCcw } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui';

/** Límite de error de las páginas: típicamente, el backend no responde. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Queda en la consola del navegador para depurar; la persona ve un mensaje claro.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-50 text-danger-600"
        aria-hidden
      >
        <CloudOff className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink sm:text-3xl">Algo salió mal</h1>
      <p className="mt-3 text-ink-muted">
        No pudimos cargar esta página. Es posible que el servidor de Rynok no esté disponible en este momento.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-muted">Código: {error.digest}</p>}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button onClick={reset} icon={<RotateCcw className="h-4 w-4" aria-hidden />}>
          Reintentar
        </Button>
        <ButtonLink href="/" variant="outline">
          Ir al inicio
        </ButtonLink>
      </div>
    </div>
  );
}
