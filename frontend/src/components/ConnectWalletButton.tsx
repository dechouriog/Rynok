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
        disabled={isConnecting || !!address}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white ${
          address ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
        }`}
      >
        <Wallet className="h-4 w-4" />
        {address ? shorten(address) : isConnecting ? 'Conectando...' : 'Conectar wallet'}
      </button>
      {error && <span className="mt-1 text-xs text-red-500">{error}</span>}
    </div>
  );
}
