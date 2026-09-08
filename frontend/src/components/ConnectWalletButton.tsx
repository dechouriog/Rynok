'use client';
import { useWallet } from '@/context/WalletContext';

function shorten(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export function ConnectWalletButton() {
  const { address, connect, isConnecting, error } = useWallet();

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={connect}
        disabled={isConnecting}
        className="bg-rynok-accent text-white px-3 py-1.5 rounded-lg text-sm"
      >
        {address ? shorten(address) : isConnecting ? 'Conectando...' : 'Conectar wallet'}
      </button>
      {error && <span className="text-xs text-red-300">{error}</span>}
    </div>
  );
}