'use client';
import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';

type Result<T> = { key: string; data?: T; error?: string };

/**
 * Carga datos que requieren sesión. `loading` se deriva de la clave (wallet + recargas), así que no
 * hay setState síncrono dentro del efecto; si el JWT expiró, `withSession` reconecta y reintenta.
 */
export function useAuthedData<T>(load: (token: string) => Promise<T>) {
  const { address, withSession } = useWallet();
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<Result<T>>({ key: '' });
  const key = address ? `${address}:${version}` : '';

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    withSession(load)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((err: unknown) => {
        if (cancelled) return;
        setResult({ key, error: err instanceof ApiError ? err.message : 'No se pudieron cargar los datos.' });
      });
    return () => {
      cancelled = true;
    };
    // `load` suele ser una función estable importada de lib/api.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, withSession]);

  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const current = result.key === key ? result : { key };
  return { data: current.data, error: current.error, loading: Boolean(key) && result.key !== key, reload };
}
