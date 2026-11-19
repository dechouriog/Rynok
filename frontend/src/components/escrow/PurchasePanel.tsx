'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, Info, Loader2 } from 'lucide-react';
import { getMyTransactions, type Property } from '@/lib/api';
import { getListingState, isEscrowConfigured, type ListingState } from '@/lib/blockchain';
import { useWallet } from '@/context/WalletContext';
import { BuyButton } from '../BuyButton';
import { OwnerPanel } from './OwnerPanel';

/**
 * Decide qué ve cada persona en el detalle según el estado de la propiedad, si es el dueño o el
 * comprador, y el registro en el contrato: el botón de compra solo aparece si el vendedor habilitó
 * la venta en cadena con exactamente el precio publicado.
 */
export function PurchasePanel({ property }: { property: Property }) {
  const { address, token } = useWallet();
  const isOwner = Boolean(address && address === property.owner.walletAddress.toLowerCase());
  const [listing, setListing] = useState<{ key: string; state: ListingState } | null>(null);
  const [isMyPurchase, setIsMyPurchase] = useState(false);

  const canBuy = property.status === 'AVAILABLE' && !isOwner && isEscrowConfigured;
  const listingKey = `${property.id}:${property.priceEth}`;

  useEffect(() => {
    if (!canBuy) return;
    let cancelled = false;
    getListingState(property.id, property.owner.walletAddress, property.priceEth).then(
      (state) => !cancelled && setListing({ key: listingKey, state }),
    );
    return () => {
      cancelled = true;
    };
  }, [canBuy, listingKey, property.id, property.owner.walletAddress, property.priceEth]);

  useEffect(() => {
    if (property.status !== 'IN_ESCROW' || !token || isOwner) return;
    let cancelled = false;
    getMyTransactions(token)
      .then(
        (txs) =>
          !cancelled &&
          setIsMyPurchase(txs.some((t) => t.propertyId === property.id && t.status === 'AWAITING_DELIVERY')),
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [property.status, property.id, token, isOwner]);

  if (isOwner) return <OwnerPanel property={property} />;

  if (property.status === 'SOLD') {
    return (
      <Notice icon={<Info className="h-4 w-4" />}>Esta propiedad ya se vendió a través del escrow de Rynok.</Notice>
    );
  }

  if (property.status === 'IN_ESCROW') {
    return isMyPurchase ? (
      <Notice icon={<Clock className="h-4 w-4" />} tone="brand">
        Tus fondos están en escrow para esta propiedad.{' '}
        <Link href="/escrow" className="font-semibold underline">
          Confirmar entrega o reclamar reembolso
        </Link>
      </Notice>
    ) : (
      <Notice icon={<Clock className="h-4 w-4" />}>Otro comprador tiene fondos en escrow para esta propiedad.</Notice>
    );
  }

  if (!isEscrowConfigured) {
    return (
      <Notice icon={<Info className="h-4 w-4" />}>Las compras en ETH no están configuradas en esta instalación.</Notice>
    );
  }

  const state = listing?.key === listingKey ? listing.state : null;
  if (!state) {
    return (
      <p role="status" className="flex h-12 items-center justify-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Verificando el contrato…
      </p>
    );
  }

  if (state.status === 'not-listed') {
    return (
      <Notice icon={<Info className="h-4 w-4" />}>
        El vendedor aún no habilitó la compra en el contrato. Vuelve pronto o guarda el enlace.
      </Notice>
    );
  }
  if (state.status === 'price-mismatch') {
    return (
      <Notice icon={<AlertTriangle className="h-4 w-4" />} tone="warning">
        El precio registrado en el contrato no coincide con el publicado. Por seguridad, la compra está deshabilitada
        hasta que el vendedor lo actualice.
      </Notice>
    );
  }
  if (state.status === 'unavailable') {
    return (
      <Notice icon={<AlertTriangle className="h-4 w-4" />} tone="warning">
        {state.reason} Revisa tu conexión y recarga la página.
      </Notice>
    );
  }

  return <BuyButton property={property} />;
}

function Notice({
  icon,
  tone = 'neutral',
  children,
}: {
  icon: React.ReactNode;
  tone?: 'neutral' | 'brand' | 'warning';
  children: React.ReactNode;
}) {
  const tones = {
    neutral: 'bg-surface-muted text-ink-soft',
    brand: 'bg-brand-50 text-brand-800',
    warning: 'bg-warning-50 text-warning-700',
  };
  return (
    <div role="status" className={`flex gap-2 rounded-control p-4 text-sm ${tones[tone]}`}>
      <span className="mt-0.5 shrink-0" aria-hidden>
        {icon}
      </span>
      <p>{children}</p>
    </div>
  );
}
