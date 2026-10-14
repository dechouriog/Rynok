'use client';
import { useState } from 'react';
import Link from 'next/link';
import { confirmEscrowRelease, formatEth, refundEscrow, type EscrowTransaction } from '@/lib/api';
import { claimRefundOnChain, confirmDeliveryOnChain, DELIVERY_PERIOD_MS, refundOnChain } from '@/lib/blockchain';

type Action = 'confirm' | 'refund' | 'claim';

const QUESTION: Record<Action, string> = {
  confirm: '¿Confirmas que recibiste la propiedad? Los fondos se liberarán al vendedor.',
  refund: '¿Reembolsar el depósito al comprador? La propiedad volverá a estar a la venta.',
  claim: 'Venció el plazo de entrega. ¿Recuperar tus fondos del escrow?',
};

const STATUS_LABEL: Record<EscrowTransaction['status'], { label: string; className: string }> = {
  AWAITING_DELIVERY: { label: 'Fondos retenidos', className: 'bg-amber-100 text-amber-700' },
  COMPLETE: { label: 'Completado', className: 'bg-emerald-100 text-emerald-700' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-slate-100 text-slate-600' },
};

export function TransactionRow({ tx, myWallet, token, onUpdated }: {
  tx: EscrowTransaction;
  myWallet: string;
  /** Sin token la fila es de solo lectura. */
  token?: string | null;
  onUpdated?: (tx: EscrowTransaction) => void;
}) {
  const isBuyer = tx.buyerWallet.toLowerCase() === myWallet.toLowerCase();
  const { label, className } = STATUS_LABEL[tx.status];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canAct = Boolean(token) && tx.status === 'AWAITING_DELIVERY';
  const deadlinePassed =
    Boolean(tx.createdAt) && Date.now() >= new Date(tx.createdAt).getTime() + DELIVERY_PERIOD_MS;

  async function run(action: Action) {
    if (!token || !confirm(QUESTION[action])) return;

    setBusy(true);
    setError(null);
    try {
      const { propertyId, sellerWallet } = tx;
      const updated =
        action === 'confirm'
          ? await confirmEscrowRelease(propertyId, await confirmDeliveryOnChain(propertyId, sellerWallet), token)
          : action === 'refund'
            ? await refundEscrow(propertyId, await refundOnChain(propertyId, sellerWallet), token)
            : await refundEscrow(propertyId, await claimRefundOnChain(propertyId, sellerWallet), token);
      onUpdated?.(updated);
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? 'No se pudo completar la operación.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <Link href={`/properties/${tx.propertyId}`} className="font-medium text-slate-900 hover:underline">
            {isBuyer ? 'Compra' : 'Venta'}
          </Link>
          <p className="text-xs text-slate-400">
            {isBuyer ? `Vendedor: ${tx.sellerWallet}` : `Comprador: ${tx.buyerWallet}`}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-slate-900">{formatEth(tx.amountEth)} ETH</p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
        </div>
      </div>

      {canAct && (
        <div className="mt-3 flex items-center justify-end gap-3 border-t border-slate-100 pt-3">
          {error && <p className="mr-auto text-xs text-red-500">{error}</p>}
          {isBuyer && deadlinePassed && (
            <button
              onClick={() => run('claim')}
              disabled={busy}
              className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
            >
              Reclamar reembolso
            </button>
          )}
          <button
            onClick={() => run(isBuyer ? 'confirm' : 'refund')}
            disabled={busy}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50 ${
              isBuyer
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'border border-red-300 text-red-600 hover:bg-red-50'
            }`}
          >
            {busy ? 'Confirmando en MetaMask...' : isBuyer ? 'Confirmar entrega' : 'Reembolsar al comprador'}
          </button>
        </div>
      )}
    </div>
  );
}
