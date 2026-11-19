'use client';
import Link from 'next/link';
import { AlertTriangle, ExternalLink, Wallet } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { CHAIN } from '@/lib/blockchain';
import { shortenAddress } from '@/lib/format';
import { Button, buttonClasses } from '@/components/ui';

/**
 * Texto corto en móvil y completo desde `sm`. El nombre accesible (aria-label) siempre es el completo.
 * Evita que la barra superior desborde a 360 px con fuentes más anchas (p. ej. las de Linux).
 */
function Responsive({ short, full }: { short: string; full: string }) {
  return (
    <>
      <span className="sm:hidden" aria-hidden>
        {short}
      </span>
      <span className="hidden sm:inline" aria-hidden>
        {full}
      </span>
    </>
  );
}

/** Botón de la barra superior: refleja si hay MetaMask, la red y la sesión. */
export function ConnectWalletButton() {
  const { address, connect, isConnecting, hasProvider, isWrongNetwork, switchNetwork } = useWallet();

  if (!hasProvider) {
    return (
      <a
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instalar MetaMask"
        className={buttonClasses('outline', 'sm')}
      >
        <ExternalLink className="h-4 w-4" aria-hidden />
        <Responsive short="MetaMask" full="Instalar MetaMask" />
      </a>
    );
  }

  if (address && isWrongNetwork) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={switchNetwork}
        aria-label={`Cambiar a ${CHAIN.name}`}
        className="border-warning-600/40 text-warning-700"
      >
        <AlertTriangle className="h-4 w-4" aria-hidden />
        <Responsive short={CHAIN.name} full={`Cambiar a ${CHAIN.name}`} />
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
      aria-label={isConnecting ? 'Conectando…' : 'Conectar wallet'}
      icon={<Wallet className="h-4 w-4" aria-hidden />}
    >
      <Responsive short="Conectar" full="Conectar wallet" />
    </Button>
  );
}
