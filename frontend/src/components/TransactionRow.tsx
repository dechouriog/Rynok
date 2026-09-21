import type { EscrowTransaction } from '@/lib/api';

const STATUS_LABEL: Record<EscrowTransaction['status'], { label: string; className: string }> = {
  AWAITING_DELIVERY: { label: 'Fondos retenidos', className: 'bg-amber-100 text-amber-700' },
  COMPLETE: { label: 'Completado', className: 'bg-emerald-100 text-emerald-700' },
  REFUNDED: { label: 'Reembolsado', className: 'bg-slate-100 text-slate-600' },
};

export function TransactionRow({ tx, myWallet }: { tx: EscrowTransaction; myWallet: string }) {
  const isBuyer = tx.buyerWallet.toLowerCase() === myWallet.toLowerCase();
  const { label, className } = STATUS_LABEL[tx.status];

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
      <div>
        <p className="font-medium text-slate-900">{isBuyer ? 'Compra' : 'Venta'}</p>
        <p className="text-xs text-slate-400">
          {isBuyer ? `Vendedor: ${tx.sellerWallet}` : `Comprador: ${tx.buyerWallet}`}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-slate-900">{tx.amountEth} ETH</p>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${className}`}>{label}</span>
      </div>
    </div>
  );
}