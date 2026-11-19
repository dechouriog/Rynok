import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { AccountShell } from '@/components/layout/AccountShell';
import { RequireWallet } from '@/components/RequireWallet';
import { WalletView } from './WalletView';

export const metadata: Metadata = { title: 'Mi wallet' };

export default function WalletPage() {
  return (
    <AccountShell>
      <PageHeader title="Mi wallet" description="La wallet con la que inicias sesión, compras y vendes en Rynok." />
      <div className="mt-8 max-w-2xl">
        <RequireWallet
          title="Ninguna wallet conectada"
          description="Conecta MetaMask para ver tu dirección, la red y tu saldo."
        >
          <WalletView />
        </RequireWallet>
      </div>
    </AccountShell>
  );
}
