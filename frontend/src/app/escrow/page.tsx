import { ReceiptText } from 'lucide-react';
import { DashboardSidebar } from '@/components/DashboardSidebar';

export default function EscrowPage() {
  return (
    <div className="mx-auto flex max-w-6xl">
      <DashboardSidebar active="/escrow" />
      <div className="flex-1 px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Historial de escrow</h1>
        <p className="mt-1 text-slate-500">
          Todas tus compras y ventas protegidas por el smart contract de escrow.
        </p>

        <div className="mt-10 flex flex-col items-center rounded-xl border border-dashed border-slate-300 py-16 text-center">
          <ReceiptText className="mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-600">El escrow en Solidity llega en la próxima entrega</p>
          <p className="mt-1 max-w-sm text-sm text-slate-400">
            Por ahora puedes explorar y publicar propiedades. Las compras protegidas con smart contract
            se habilitarán cuando se integre el contrato de escrow con el marketplace.
          </p>
        </div>
      </div>
    </div>
  );
}
