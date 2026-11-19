import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { AccountShell } from '@/components/layout/AccountShell';
import { RequireWallet } from '@/components/RequireWallet';
import { DashboardView } from './DashboardView';

export const metadata: Metadata = { title: 'Mi panel' };

export default function DashboardPage() {
  return (
    <AccountShell>
      <PageHeader title="Mi panel" description="Resumen de tus propiedades y de las compras en curso." />
      <div className="mt-8">
        <RequireWallet
          title="Conecta tu wallet para ver tu panel"
          description="Firmarás un mensaje con MetaMask para iniciar sesión. No cuesta gas ni envía transacciones."
        >
          <DashboardView />
        </RequireWallet>
      </div>
    </AccountShell>
  );
}
