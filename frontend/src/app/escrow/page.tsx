import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { AccountShell } from '@/components/layout/AccountShell';
import { RequireWallet } from '@/components/RequireWallet';
import { EscrowView } from './EscrowView';

export const metadata: Metadata = { title: 'Compras y ventas' };

export default function EscrowPage() {
  return (
    <AccountShell>
      <PageHeader
        title="Compras y ventas"
        description="Operaciones protegidas por el contrato de escrow. Confirma la entrega, pide un reembolso o cancela una venta."
      />
      <div className="mt-8">
        <RequireWallet
          title="Conecta tu wallet para ver tus operaciones"
          description="Tus compras y ventas están asociadas a la wallet con la que firmaste."
        >
          <EscrowView />
        </RequireWallet>
      </div>
    </AccountShell>
  );
}
