'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteProperty } from '@/lib/api';
import { getListingState, listOnChain, type ListingState } from '@/lib/blockchain';
import { useWallet } from '@/context/WalletContext';
import type { Property } from '@/lib/api';

/** Botón para que el dueño habilite la compra on-chain (Escrow.list). */
function EnablePurchase({ property }: { property: Property }) {
  const [listing, setListing] = useState<ListingState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getListingState(property.id, property.owner.walletAddress, property.priceEth).then(setListing);
  }, [property.id, property.owner.walletAddress, property.priceEth]);

  if (!listing) return null;

  if (listing.status === 'listed') {
    return <p className="mt-4 text-sm font-medium text-emerald-600">Compra habilitada on-chain.</p>;
  }

  if (listing.status === 'unavailable') {
    return <p className="mt-4 text-sm text-slate-500">{listing.reason}</p>;
  }

  async function handleList() {
    setBusy(true);
    setError(null);
    try {
      await listOnChain(property.id, property.priceEth);
      setListing({ status: 'listed' });
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? 'No se pudo habilitar la compra.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleList}
        disabled={busy}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {busy
          ? 'Confirmando en MetaMask...'
          : listing.status === 'price-mismatch'
            ? 'Actualizar precio on-chain'
            : 'Habilitar compra'}
      </button>
      <p className="mt-2 text-xs text-slate-400">
        {listing.status === 'price-mismatch'
          ? 'El precio on-chain no coincide con el publicado; los compradores no pueden comprar hasta actualizarlo.'
          : 'Firma una transacción que fija el precio en el contrato de escrow para que los compradores puedan pagar.'}
      </p>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}

export function PropertyOwnerActions({ property }: { property: Property }) {
  const router = useRouter();
  const { profile, token } = useWallet();

  if (!profile || profile.id !== property.owner.id) return null;

  async function handleDelete() {
    if (!token) return;
    if (!confirm('¿Eliminar esta propiedad?')) return;
    await deleteProperty(property.id, token);
    router.push('/properties');
  }

  return (
    <>
      {(property.status ?? 'AVAILABLE') === 'AVAILABLE' && <EnablePurchase property={property} />}
      <div className="mt-4 flex gap-3">
        <a href={`/properties/${property.id}/edit`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Editar
        </a>
        <button onClick={handleDelete} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
          Eliminar
        </button>
      </div>
    </>
  );
}
