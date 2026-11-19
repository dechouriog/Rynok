'use client';
import type { ReactNode } from 'react';
import { ExternalLink, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { Button, EmptyState, buttonClasses } from '@/components/ui';

type RequireWalletProps = { title: string; description: string; children: ReactNode };

/** Muestra el contenido solo con sesión iniciada; si no, explica por qué y ofrece conectar o instalar MetaMask. */
export function RequireWallet({ title, description, children }: RequireWalletProps) {
  const { address, connect, isConnecting, hasProvider } = useWallet();
  if (address) return <>{children}</>;

  return (
    <EmptyState
      icon={<Wallet />}
      title={title}
      description={description}
      action={
        hasProvider ? (
          <Button
            onClick={() => void connect()}
            loading={isConnecting}
            loadingText="Esperando firma…"
            icon={<Wallet className="h-4 w-4" aria-hidden />}
          >
            Conectar wallet
          </Button>
        ) : (
          <a href="https://metamask.io/download/" target="_blank" rel="noopener noreferrer" className={buttonClasses()}>
            <ExternalLink className="h-4 w-4" aria-hidden /> Instalar MetaMask
          </a>
        )
      }
    />
  );
}
