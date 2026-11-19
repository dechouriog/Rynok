'use client';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { CHAIN } from '@/lib/blockchain';
import { shortenAddress } from '@/lib/format';
import { Button, buttonClasses } from '@/components/ui';

/** Botón de la barra superior: refleja si hay MetaMask, la red y la sesión. */
export function ConnectWalletButton({ compact = false }: { compact?: boolean }) {
  const { address, connect, isConnecting, hasProvider, isWrongNetwork, switchNetwork } = useWallet();

  if (!hasProvider) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses('outline', 'sm')}
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        {compact ? 'MetaMask' : 'Instalar MetaMask'}
      </a>
    );
  }

  if (address && isWrongNetwork) {
    return (
      <Button variant="outline" size="sm" onClick={switchNetwork} className="border-warning-600/40 text-warning-700">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        {compact ? CHAIN.name : `Cambiar a ${CHAIN.name}`}
      </Button>
    );
  }

  if (address) {
    return (
      <Link
        href="/wallet"
        className={buttonClasses('outline', 'sm', 'font-mono')}
        aria-label={`Wallet conectada ${address}`}
      >
        <span className="h-2 w-2 rounded-full bg-success-600" aria-hidden />
        {shortenAddress(address)}
      </Link>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => void connect()}
      loading={isConnecting}
      loadingText="Conectando…"
      icon={<Wallet className="h-4 w-4" aria-hidden />}
    >
      Conectar wallet
    </Button>
  );
}
