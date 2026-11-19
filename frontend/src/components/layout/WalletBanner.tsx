'use client';
import { AlertTriangle, XCircle } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { CHAIN } from '@/lib/blockchain';
import { Button } from '@/components/ui';

/** Avisos globales: red equivocada o error al conectar la wallet. */
export function WalletBanner() {
  const { isWrongNetwork, switchNetwork, error } = useWallet();

  if (isWrongNetwork) {
    return (
      <div role="alert" className="border-b border-warning-600/30 bg-warning-50">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-sm text-warning-700">
          <p className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            MetaMask está en otra red. Rynok funciona en <strong>{CHAIN.name}</strong>.
          </p>
          <Button size="sm" variant="outline" onClick={switchNetwork}>
            Cambiar a {CHAIN.name}
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="border-b border-danger-600/20 bg-danger-50">
        <p className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 text-sm text-danger-700">
          <XCircle className="h-4 w-4 shrink-0" aria-hidden /> {error}
        </p>
      </div>
    );
  }
  return null;
}
