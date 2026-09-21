'use client';

import { useEffect, useState } from 'react';
import { ReceiptText } from 'lucide-react';

import { DashboardSidebar } from '@/components/DashboardSidebar';
import { TransactionRow } from '@/components/TransactionRow';
import { useWallet } from '@/context/WalletContext';
import {
  getMyTransactions,
  type EscrowTransaction,
} from '@/lib/api';

export default function EscrowPage() {
  const { address, token, connect } = useWallet();

  const [transactions, setTransactions] = useState<EscrowTransaction[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    getMyTransactions(token)
      .then(setTransactions)
      .finally(() => setLoading(false));
  }, [token]);

  if (!address) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <p className="mb-4 text-slate-600">
          Conecta tu wallet para ver tu historial de transacciones.
        </p>

        <button
          onClick={connect}
          className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Conectar wallet
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-6xl">
      <DashboardSidebar active="/escrow" />

      <div className="flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">
          Historial de escrow
        </h1>

        <p className="mt-1 text-slate-500">
          Todas tus compras y ventas protegidas por el smart contract de
          escrow.
        </p>

        {loading ? (
          <p className="mt-8 text-sm text-slate-400">
            Cargando...
          </p>
        ) : transactions.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
            <ReceiptText className="mb-3 h-8 w-8 text-slate-300" />

            <p className="font-medium text-slate-600">
              Aún no tienes transacciones
            </p>

            <p className="mt-1 max-w-sm text-sm text-slate-400">
              Cuando compres o vendas una propiedad, el historial
              aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                myWallet={address}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}