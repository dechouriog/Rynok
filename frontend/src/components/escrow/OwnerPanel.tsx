'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, RefreshCw, ShieldCheck, Trash2 } from 'lucide-react';
import { ApiError, deleteProperty, type Property } from '@/lib/api';
import { describeTxError, getListingState, isEscrowConfigured, listOnChain, type ListingState } from '@/lib/blockchain';
import { formatEth } from '@/lib/format';
import { useWallet } from '@/context/WalletContext';
import { Button, ButtonLink, Modal, useToast } from '@/components/ui';

const errorMessage = (err: unknown) => (err instanceof ApiError ? err.message : describeTxError(err));

/** Acciones del dueño: habilitar la compra (o actualizar el precio) en el contrato, editar y eliminar. */
export function OwnerPanel({ property }: { property: Property }) {
  const router = useRouter();
  const { toast } = useToast();
  const { withSession } = useWallet();
  const [listing, setListing] = useState<{ key: string; state: ListingState } | null>(null);
  const [busy, setBusy] = useState<'list' | 'delete' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [version, setVersion] = useState(0);

  const available = property.status === 'AVAILABLE';
  const listingKey = `${property.id}:${property.priceEth}:${version}`;

  useEffect(() => {
    if (!available || !isEscrowConfigured) return;
    let cancelled = false;
    getListingState(property.id, property.owner.walletAddress, property.priceEth).then(
      (state) => !cancelled && setListing({ key: listingKey, state }),
    );
    return () => {
      cancelled = true;
    };
  }, [available, listingKey, property.id, property.owner.walletAddress, property.priceEth]);

  const state = listing?.key === listingKey ? listing.state : null;

  async function enable() {
    setBusy('list');
    try {
      await listOnChain(property.id, property.priceEth);
      toast({ tone: 'success', title: 'Compra habilitada: ya pueden pagarte en ETH' });
      setVersion((v) => v + 1);
    } catch (err) {
      toast({ tone: 'error', title: 'No se completó la operación', description: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  async function remove() {
    setBusy('delete');
    try {
      await withSession((token) => deleteProperty(property.id, token));
      toast({ tone: 'success', title: 'Propiedad eliminada' });
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setConfirmDelete(false);
      toast({ tone: 'error', title: 'No se pudo eliminar', description: errorMessage(err) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {available && isEscrowConfigured && !state && (
        <p role="status" className="flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Consultando el contrato…
        </p>
      )}

      {available && state && (state.status === 'not-listed' || state.status === 'price-mismatch') && (
        <div className="rounded-control border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-semibold text-brand-800">
            {state.status === 'not-listed'
              ? 'Habilita la compra para vender en ETH'
              : 'Actualiza el precio en el contrato'}
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {state.status === 'not-listed'
              ? `Registraremos la propiedad en el contrato de escrow con el precio de ${formatEth(property.priceEth)}. Solo pagas el gas.`
              : `El precio en el contrato no coincide con ${formatEth(property.priceEth)}: nadie puede comprar hasta que lo actualices.`}
          </p>
          <Button
            className="mt-3"
            fullWidth
            onClick={enable}
            loading={busy === 'list'}
            loadingText="Confirma en MetaMask…"
            disabled={busy !== null}
            icon={
              state.status === 'not-listed' ? (
                <ShieldCheck className="h-4 w-4" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )
            }
          >
            {state.status === 'not-listed' ? 'Habilitar compra' : 'Actualizar precio on-chain'}
          </Button>
        </div>
      )}

      {available && state?.status === 'listed' && (
        <div className="rounded-control border border-success-600/30 bg-success-50 p-4">
          <p className="text-sm font-semibold text-success-700">Compra habilitada en el contrato</p>
          <p className="mt-1 text-sm text-ink-soft">
            Cualquier comprador puede depositar {formatEth(property.priceEth)} en escrow.
          </p>
        </div>
      )}

      {available && state?.status === 'unavailable' && <p className="text-sm text-ink-muted">{state.reason}</p>}

      {!available && (
        <p className="rounded-control bg-surface-muted p-4 text-sm text-ink-soft">
          {property.status === 'IN_ESCROW'
            ? 'Un comprador depositó los fondos. Gestiona la operación desde Compras y ventas.'
            : 'Vendiste esta propiedad. El pago se liberó a tu wallet.'}{' '}
          <Link href="/escrow" className="font-medium text-brand-600 hover:underline">
            Ver operación
          </Link>
        </p>
      )}

      <div className="flex gap-2">
        {available && (
          <ButtonLink
            href={`/properties/${property.id}/edit`}
            variant="outline"
            size="sm"
            className="flex-1"
            icon={<Pencil className="h-4 w-4" aria-hidden />}
          >
            Editar
          </ButtonLink>
        )}
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-danger-700 hover:bg-danger-50"
          onClick={() => setConfirmDelete(true)}
          disabled={property.status === 'IN_ESCROW' || busy !== null}
          title={property.status === 'IN_ESCROW' ? 'No se puede eliminar con fondos en escrow' : undefined}
          icon={<Trash2 className="h-4 w-4" aria-hidden />}
        >
          Eliminar
        </Button>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        locked={busy === 'delete'}
        title="¿Eliminar esta propiedad?"
        description={
          <>
            Se borrará <strong>{property.title}</strong> del marketplace. Esta acción no se puede deshacer.
          </>
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmDelete(false)} disabled={busy === 'delete'}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={remove} loading={busy === 'delete'} loadingText="Eliminando…">
              Sí, eliminar
            </Button>
          </>
        }
      >
        {state?.status === 'listed' && (
          <p className="rounded-control bg-warning-50 p-3 text-sm text-warning-700">
            La compra sigue habilitada en el contrato. Rynok no registrará pagos de una propiedad eliminada, pero el
            registro en cadena permanece.
          </p>
        )}
      </Modal>
    </div>
  );
}
