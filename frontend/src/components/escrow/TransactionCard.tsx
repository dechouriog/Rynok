'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CalendarClock, CheckCircle2, RotateCcw, Undo2 } from 'lucide-react';
import { ApiError, confirmEscrowRelease, refundEscrow, type EscrowTransaction } from '@/lib/api';
import {
  DELIVERY_PERIOD_DAYS,
  DELIVERY_PERIOD_MS,
  claimRefundOnChain,
  confirmDeliveryOnChain,
  describeTxError,
  refundOnChain,
} from '@/lib/blockchain';
import { formatDate, formatEth, formatRelative, shortenAddress } from '@/lib/format';
import { useWallet } from '@/context/WalletContext';
import { Button, Card, Modal, useToast } from '@/components/ui';
import { EscrowStatusBadge } from '../property/StatusBadge';
import { PropertyImage } from '../property/PropertyImage';
import { TxLink } from './TxLink';

type ActionKind = 'confirm' | 'claim' | 'refund';

const ACTIONS: Record<
  ActionKind,
  { title: string; description: string; cta: string; success: string; variant: 'success' | 'primary' | 'danger' }
> = {
  confirm: {
    title: '¿Confirmas que recibiste la propiedad?',
    description: 'Los fondos se liberarán al vendedor de inmediato. Esta acción no se puede deshacer.',
    cta: 'Sí, liberar el pago',
    success: 'Entrega confirmada: el pago se liberó al vendedor',
    variant: 'success',
  },
  claim: {
    title: '¿Reclamar el reembolso?',
    description: `Venció el plazo de entrega de ${DELIVERY_PERIOD_DAYS} días. El contrato te devolverá el monto completo.`,
    cta: 'Reclamar reembolso',
    success: 'Reembolso recibido en tu wallet',
    variant: 'primary',
  },
  refund: {
    title: '¿Reembolsar al comprador?',
    description:
      'El comprador recibirá el monto completo y la propiedad volverá a estar a la venta (con la compra habilitada al mismo precio).',
    cta: 'Sí, devolver los fondos',
    success: 'Venta cancelada: el comprador recibió su reembolso',
    variant: 'danger',
  },
};

export function TransactionCard({
  tx,
  role,
  onChanged,
}: {
  tx: EscrowTransaction;
  role: 'buyer' | 'seller';
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const { withSession } = useWallet();
  const [action, setAction] = useState<ActionKind | null>(null);
  const [busy, setBusy] = useState(false);
  const [now] = useState(() => Date.now());

  const refundAt = new Date(new Date(tx.createdAt).getTime() + DELIVERY_PERIOD_MS);
  const refundReady = refundAt.getTime() <= now;
  const counterpart = role === 'buyer' ? tx.sellerWallet : tx.buyerWallet;
  const settleHash = tx.releaseTxHash ?? tx.refundTxHash;
  const title = tx.property?.title ?? 'Propiedad eliminada';

  async function run(kind: ActionKind) {
    setBusy(true);
    try {
      const { propertyId, sellerWallet } = tx;
      if (kind === 'confirm') {
        const hash = await confirmDeliveryOnChain(propertyId, sellerWallet);
        await withSession((token) => confirmEscrowRelease(propertyId, hash, token));
      } else {
        const hash =
          kind === 'claim'
            ? await claimRefundOnChain(propertyId, sellerWallet)
            : await refundOnChain(propertyId, sellerWallet);
        await withSession((token) => refundEscrow(propertyId, hash, token));
      }
      toast({ tone: 'success', title: ACTIONS[kind].success });
      setAction(null);
      onChanged();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'No se completó la operación',
        description: err instanceof ApiError ? err.message : describeTxError(err),
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="overflow-hidden" data-testid="transaction-card">
      <div className="flex flex-col sm:flex-row">
        <div className="relative aspect-video w-full shrink-0 bg-surface-sunken sm:aspect-auto sm:w-48">
          <PropertyImage src={tx.property?.imageUrl} alt={`Foto de ${title}`} sizes="(min-width: 640px) 192px, 100vw" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-ink">
                {tx.property ? (
                  <Link href={`/properties/${tx.propertyId}`} className="hover:text-brand-600">
                    {title}
                  </Link>
                ) : (
                  title
                )}
              </h3>
              <p className="text-sm text-ink-muted">
                {role === 'buyer' ? 'Vendedor' : 'Comprador'}:{' '}
                <span className="font-mono">{shortenAddress(counterpart)}</span>
              </p>
            </div>
            <EscrowStatusBadge status={tx.status} />
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-muted">Monto</dt>
              <dd className="font-semibold text-ink">{formatEth(tx.amountEth)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Depositado</dt>
              <dd className="text-ink">{formatDate(tx.createdAt, false)}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Depósito</dt>
              <dd>
                <TxLink hash={tx.depositTxHash} />
              </dd>
            </div>
            {settleHash && (
              <div>
                <dt className="text-ink-muted">{tx.status === 'COMPLETE' ? 'Liberación' : 'Reembolso'}</dt>
                <dd>
                  <TxLink hash={settleHash} />
                </dd>
              </div>
            )}
          </dl>

          {tx.status === 'AWAITING_DELIVERY' && (
            <div className="mt-1 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                <CalendarClock className="h-4 w-4 shrink-0" aria-hidden />
                {refundReady
                  ? `Venció el plazo de ${DELIVERY_PERIOD_DAYS} días: el comprador ya puede reclamar el reembolso.`
                  : `Reembolso por plazo disponible ${formatRelative(refundAt, new Date(now))} (${formatDate(refundAt)}).`}
              </p>
              <div className="flex flex-wrap gap-2">
                {role === 'buyer' ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setAction('claim')}
                      disabled={!refundReady}
                      title={refundReady ? undefined : `Disponible el ${formatDate(refundAt)}`}
                      icon={<RotateCcw className="h-4 w-4" aria-hidden />}
                    >
                      Reclamar reembolso
                    </Button>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => setAction('confirm')}
                      icon={<CheckCircle2 className="h-4 w-4" aria-hidden />}
                    >
                      Confirmar entrega
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAction('refund')}
                    icon={<Undo2 className="h-4 w-4" aria-hidden />}
                  >
                    Reembolsar al comprador
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {action && (
        <Modal
          open
          onClose={() => setAction(null)}
          locked={busy}
          title={ACTIONS[action].title}
          description={ACTIONS[action].description}
          footer={
            <>
              <Button variant="outline" onClick={() => setAction(null)} disabled={busy}>
                Volver
              </Button>
              <Button
                variant={ACTIONS[action].variant}
                onClick={() => run(action)}
                loading={busy}
                loadingText="Confirma en MetaMask…"
              >
                {ACTIONS[action].cta}
              </Button>
            </>
          }
        >
          <p className="rounded-control bg-surface-muted p-3 text-sm text-ink-soft">
            {title} · <strong className="text-ink">{formatEth(tx.amountEth)}</strong>
          </p>
        </Modal>
      )}
    </Card>
  );
}
