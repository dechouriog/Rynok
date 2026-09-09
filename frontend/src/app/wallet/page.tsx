'use client';
import { Star, Trash2, Wallet as WalletIcon } from 'lucide-react';
import { DashboardSidebar } from '@/components/DashboardSidebar';
import { useWallet } from '@/context/WalletContext';

export default function WalletPage() {
  const { address, connect, disconnect, isConnecting } = useWallet();

  return (
    <div className="mx-auto flex max-w-6xl">
      <DashboardSidebar active="/wallet" />
      <div className="max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Mi wallet</h1>
        <p className="mt-1 text-slate-500">Administra la wallet vinculada a tu cuenta de Rynok.</p>

        <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <WalletIcon className="h-4 w-4" />
            <span>{address ? `${address} conectada` : 'Ninguna wallet conectada en este navegador'}</span>
          </div>
          <button
            onClick={address ? disconnect : connect}
            disabled={isConnecting}
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {address ? 'Desconectar' : isConnecting ? 'Conectando...' : 'Conectar MetaMask'}
          </button>
        </div>

        {address && (
          <div className="mt-8">
            <h2 className="mb-3 font-semibold text-slate-900">Wallets vinculadas</h2>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  {address}
                </div>
                <Trash2 className="h-4 w-4 cursor-pointer text-slate-400 hover:text-red-600" onClick={disconnect} />
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
