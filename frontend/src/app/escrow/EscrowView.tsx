'use client';
import { useState } from 'react';
import { AlertTriangle, ReceiptText, Search } from 'lucide-react';
import { getMyTransactions } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import { useAuthedData } from '@/hooks/useAuthedData';
import { Button, ButtonLink, EmptyState, LoadingRegion, Skeleton, Tabs } from '@/components/ui';
import { TransactionCard } from '@/components/escrow/TransactionCard';

export function EscrowView() {
  const { address } = useWallet();
  const { data, error, loading, reload } = useAuthedData(getMyTransactions);
  const [tab, setTab] = useState<'buyer' | 'seller'>('buyer');

  if (loading) {
    return (
      <LoadingRegion label="Cargando tus operaciones…">
        <Skeleton className="h-10 w-64" />
        <div className="mt-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-card" />
          <Skeleton className="h-40 w-full rounded-card" />
        </div>
      </LoadingRegion>
    );
  }

  if (error) {
    return (
      <EmptyState
        tone="danger"
        icon={<AlertTriangle />}
        title="No pudimos cargar tus operaciones"
        description={error}
        action={<Button onClick={reload}>Reintentar</Button>}
      />
    );
  }

  const all = data ?? [];
  const purchases = all.filter((t) => t.buyerWallet.toLowerCase() === address);
  const sales = all.filter((t) => t.sellerWallet.toLowerCase() === address);
  const list = tab === 'buyer' ? purchases : sales;

  return (
    <Tabs
      label="Tipo de operación"
      value={tab}
      onChange={(id) => setTab(id as 'buyer' | 'seller')}
      items={[
        { id: 'buyer', label: 'Mis compras', count: purchases.length },
        { id: 'seller', label: 'Mis ventas', count: sales.length },
      ]}
    >
      {list.length === 0 ? (
        <EmptyState
          icon={<ReceiptText />}
          title={tab === 'buyer' ? 'Aún no has comprado propiedades' : 'Aún no has vendido propiedades'}
          description={
            tab === 'buyer'
              ? 'Cuando compres, tus fondos quedarán en escrow y podrás confirmar la entrega desde aquí.'
              : 'Publica una propiedad y habilita la compra para recibir pagos protegidos.'
          }
          action={
            tab === 'buyer' ? (
              <ButtonLink href="/properties" icon={<Search className="h-4 w-4" aria-hidden />}>
                Explorar propiedades
              </ButtonLink>
            ) : (
              <ButtonLink href="/properties/new">Publicar propiedad</ButtonLink>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          {list.map((tx) => (
            <TransactionCard key={tx.id} tx={tx} role={tab} onChanged={reload} />
          ))}
        </div>
      )}
    </Tabs>
  );
}
