'use client';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, Home, PlusCircle, Tag, type LucideIcon } from 'lucide-react';
import { getMyProperties, getMyTransactions, type EscrowTransaction, type Property } from '@/lib/api';
import { formatEth } from '@/lib/format';
import { useWallet } from '@/context/WalletContext';
import { useAuthedData } from '@/hooks/useAuthedData';
import { Button, ButtonLink, Card, EmptyState, LoadingRegion, Skeleton } from '@/components/ui';
import { PropertyStatusBadge } from '@/components/property/StatusBadge';

async function loadDashboard(token: string): Promise<{ properties: Property[]; transactions: EscrowTransaction[] }> {
  const [properties, transactions] = await Promise.all([getMyProperties(token), getMyTransactions(token)]);
  return { properties, transactions };
}

function Stat({
  icon: Icon,
  label,
  value,
  tone = 'text-ink',
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <Card className="p-4">
      <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
        <Icon className="h-4 w-4" aria-hidden /> {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{value}</p>
    </Card>
  );
}

export function DashboardView() {
  const { address } = useWallet();
  const { data, error, loading, reload } = useAuthedData(loadDashboard);

  if (loading) {
    return (
      <LoadingRegion label="Cargando tu panel…">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-card" />
          ))}
        </div>
        <Skeleton className="mt-8 h-64 w-full rounded-card" />
      </LoadingRegion>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        tone="danger"
        icon={<AlertTriangle />}
        title="No pudimos cargar tu panel"
        description={error}
        action={<Button onClick={reload}>Reintentar</Button>}
      />
    );
  }

  const { properties, transactions } = data;
  const pendingAsBuyer = transactions.filter(
    (t) => t.status === 'AWAITING_DELIVERY' && t.buyerWallet.toLowerCase() === address,
  );
  const count = (status: Property['status']) => properties.filter((p) => p.status === status).length;

  return (
    <div className="space-y-10">
      {pendingAsBuyer.length > 0 && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-card border border-warning-600/30 bg-warning-50 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="flex items-center gap-2 text-sm text-warning-700">
            <Clock className="h-4 w-4 shrink-0" aria-hidden />
            Tienes {pendingAsBuyer.length} {pendingAsBuyer.length === 1 ? 'compra' : 'compras'} con fondos en escrow
            esperando tu confirmación.
          </p>
          <ButtonLink href="/escrow" size="sm" variant="outline">
            Revisar
          </ButtonLink>
        </div>
      )}

      <section aria-label="Resumen">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={Home} label="Publicadas" value={properties.length} />
          <Stat icon={Tag} label="Disponibles" value={count('AVAILABLE')} tone="text-success-600" />
          <Stat icon={Clock} label="En escrow" value={count('IN_ESCROW')} tone="text-warning-600" />
          <Stat icon={CheckCircle2} label="Vendidas" value={count('SOLD')} tone="text-brand-600" />
        </div>
      </section>

      <section aria-labelledby="mis-propiedades">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 id="mis-propiedades" className="text-lg font-semibold text-ink">
            Mis propiedades
          </h2>
          <ButtonLink href="/properties/new" size="sm" icon={<PlusCircle className="h-4 w-4" aria-hidden />}>
            Publicar
          </ButtonLink>
        </div>
        {properties.length === 0 ? (
          <EmptyState
            icon={<Home />}
            title="Aún no publicas propiedades"
            description="Publica tu primera propiedad y habilita la compra para recibir pagos en ETH protegidos por escrow."
            action={<ButtonLink href="/properties/new">Publicar mi primera propiedad</ButtonLink>}
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {properties.map((p) => (
                <li key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <Link href={`/properties/${p.id}`} className="font-medium text-ink hover:text-brand-600">
                      {p.title}
                    </Link>
                    <p className="text-sm text-ink-muted">
                      {p.location} · {formatEth(p.priceEth)}
                    </p>
                  </div>
                  <PropertyStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </section>
    </div>
  );
}
