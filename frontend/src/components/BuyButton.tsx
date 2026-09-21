'use client';
import { useState } from 'react';
import { depositEscrow } from '@/lib/blockchain';
import { recordEscrowDeposit } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';

export function BuyButton({ propertyId, sellerWallet, priceEth }: {
  propertyId: string; sellerWallet: string; priceEth: string;
}) {
  const { address, token, connect } = useWallet();
  const [status, setStatus] = useState<'idle' | 'depositing' | 'done' | 'error'>('idle');

  async function handleBuy() {
    if (!address || !token) {
      await connect();
      return;
    }
    setStatus('depositing');
    try {
      const txHash = await depositEscrow(propertyId, sellerWallet, priceEth);
      await recordEscrowDeposit(
        { propertyId, buyerWallet: address, sellerWallet, amountEth: priceEth,
          contractAddress: process.env.NEXT_PUBLIC_ESCROW_ADDRESS!, depositTxHash: txHash },
        token,
      );
      setStatus('done');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div>
      <button
        onClick={handleBuy}
        disabled={status === 'depositing' || status === 'done'}
        className="mt-6 w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
      >
        {status === 'depositing' ? 'Confirmando en MetaMask...' : status === 'done' ? 'Fondos en escrow' : 'Comprar con MetaMask'}
      </button>
      {status === 'error' && <p className="mt-2 text-sm text-red-500">No se pudo completar el depósito.</p>}
      <p className="mt-3 text-center text-xs text-slate-400">
        Los fondos quedan retenidos en el contrato de escrow hasta que confirmes la entrega.
      </p>
    </div>
  );
}