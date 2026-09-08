'use client';
import { Wallet } from 'lucide-react';
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
        className="flex items-center gap-2 bg-rynok-primary text-white px-4 py-2 rounded-full text-sm font-medium"
      >
        <Wallet size={16} />
        {address ? shorten(address) : isConnecting ? 'Conectando...' : 'Conectar wallet'}
      </button>
      {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
    </div>
  );
}