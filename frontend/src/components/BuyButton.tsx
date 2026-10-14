'use client';
import { useEffect, useState } from 'react';
import { depositEscrow, escrowContractAddress, getListingState, type ListingState } from '@/lib/blockchain';
import { recordEscrowDeposit, type Property } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';

const UNAVAILABLE_LABEL: Record<string, string> = {
  IN_ESCROW: 'Esta propiedad ya tiene fondos en escrow',
  SOLD: 'Esta propiedad ya fue vendida',
};

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded-lg bg-slate-100 px-4 py-3 text-center text-sm font-medium text-slate-600">
      {children}
    </p>
  );
}

export function BuyButton({ propertyId, sellerWallet, priceEth, status = 'AVAILABLE' }: {
  propertyId: string; sellerWallet: string; priceEth: string; status?: Property['status'];
}) {
  const { address, token, connect } = useWallet();
  const [state, setState] = useState<'idle' | 'depositing' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [listing, setListing] = useState<ListingState | null>(null);

  const isOwner = Boolean(address) && address!.toLowerCase() === sellerWallet.toLowerCase();

  useEffect(() => {
    if (status !== 'AVAILABLE' || isOwner) return;
    let cancelled = false;
    getListingState(propertyId, sellerWallet, priceEth).then((result) => {
      if (!cancelled) setListing(result);
    });
    return () => { cancelled = true; };
  }, [propertyId, sellerWallet, priceEth, status, isOwner]);

  if (status !== 'AVAILABLE' && state !== 'done') {
    return <Notice>{UNAVAILABLE_LABEL[status ?? ''] ?? 'Propiedad no disponible'}</Notice>;
  }

  // El dueño habilita la venta desde PropertyOwnerActions.
  if (isOwner) {
    return null;
  }

  if (state !== 'done') {
    if (!listing) return <Notice>Verificando disponibilidad on-chain...</Notice>;
    if (listing.status === 'unavailable') return <Notice>{listing.reason}</Notice>;
    if (listing.status !== 'listed') return <Notice>El vendedor aún no habilitó la compra on-chain.</Notice>;
  }

  async function handleBuy() {
    if (!address || !token) {
      await connect();
      return;
    }
    setState('depositing');
    setError(null);
    try {
      const txHash = await depositEscrow(propertyId, sellerWallet, priceEth);
      await recordEscrowDeposit(
        { propertyId, buyerWallet: address, sellerWallet, amountEth: priceEth,
          contractAddress: escrowContractAddress(), depositTxHash: txHash },
        token,
      );
      setState('done');
    } catch (err: any) {
      setError(err?.shortMessage ?? err?.message ?? 'No se pudo completar el depósito.');
      setState('error');
    }
  }

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={state === 'depositing' || state === 'done'}
        className="mt-6 w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {state === 'depositing' ? 'Confirmando en MetaMask...' : state === 'done' ? 'Fondos en escrow' : 'Comprar con MetaMask'}
      </button>
      {state === 'error' && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <p className="mt-3 text-center text-xs text-slate-400">
        Los fondos quedan retenidos en el contrato de escrow hasta que confirmes la entrega.
        Si no se confirma en 30 días, puedes reclamar tu reembolso.
      </p>
    </div>
  );
}
