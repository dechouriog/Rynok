'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Wallet } from 'lucide-react';
import { ApiError, recordEscrowDeposit, type Property } from '@/lib/api';
import { CHAIN, DELIVERY_PERIOD_DAYS, ESCROW_ADDRESS, depositEscrow, describeTxError } from '@/lib/blockchain';
import { formatEth, shortenAddress } from '@/lib/format';
import { useWallet } from '@/context/WalletContext';
import { Button, Modal, useToast } from '@/components/ui';
import { TxLink } from './escrow/TxLink';

type Phase = 'idle' | 'confirm' | 'signing' | 'registering';

/**
 * Compra protegida: deposita exactamente el precio en el contrato de escrow y registra la operación
 * en la API (que la verifica on-chain). Solo se renderiza cuando el vendedor habilitó la compra.
 */
export function BuyButton({ property }: { property: Property }) {
  const router = useRouter();
  const { toast } = useToast();
  const { address, connect, withSession, isConnecting } = useWallet();
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  /** Depósito ya confirmado en cadena pero no registrado (p. ej. backend caído): se reintenta sin pagar de nuevo. */
  const [pendingTx, setPendingTx] = useState<string | null>(null);

  async function open() {
    setError(null);
    if (!address && !(await connect())) return;
    setPhase('confirm');
  }

  async function register(depositTxHash: string) {
    setPhase('registering');
    try {
      await withSession((token) =>
        recordEscrowDeposit(
          { propertyId: property.id, amountEth: property.priceEth, contractAddress: ESCROW_ADDRESS, depositTxHash },
          token,
        ),
      );
      setPendingTx(null);
      setPhase('idle');
      toast({
        tone: 'success',
        title: 'Compra protegida en escrow',
        description: `Depositaste ${formatEth(property.priceEth)}. Confirma la entrega cuando recibas la propiedad.`,
      });
      router.push('/escrow');
      router.refresh();
    } catch (err) {
      setPendingTx(depositTxHash);
      setPhase('confirm');
      setError(
        `Tu pago quedó en el contrato, pero no pudimos registrarlo en Rynok: ${
          err instanceof ApiError ? err.message : 'error desconocido'
        }. Reintenta el registro; no se te cobrará otra vez.`,
      );
    }
  }

  async function buy() {
    setError(null);
    setPhase('signing');
    let txHash: string;
    try {
      txHash = await depositEscrow(property.id, property.owner.walletAddress, property.priceEth);
    } catch (err) {
      setPhase('confirm');
      setError(describeTxError(err));
      return;
    }
    await register(txHash);
  }

  const busy = phase === 'signing' || phase === 'registering';

  return (
    <>
      <Button
        size="lg"
        fullWidth
        onClick={open}
        loading={isConnecting}
        icon={<Wallet className="h-5 w-5" aria-hidden />}
      >
        Comprar con MetaMask
      </Button>

      <Modal
        open={phase !== 'idle'}
        onClose={() => setPhase('idle')}
        locked={busy}
        title="Confirmar compra protegida"
        description={
          <>
            Vas a depositar <strong>{formatEth(property.priceEth)}</strong> en el contrato de escrow en la red{' '}
            {CHAIN.name}.
          </>
        }
        footer={
          pendingTx ? (
            <Button onClick={() => register(pendingTx)} loading={phase === 'registering'} loadingText="Registrando…">
              Reintentar registro
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setPhase('idle')} disabled={busy}>
                Cancelar
              </Button>
              <Button
                onClick={buy}
                loading={busy}
                loadingText={phase === 'signing' ? 'Confirma en MetaMask…' : 'Registrando compra…'}
                icon={<ShieldCheck className="h-4 w-4" aria-hidden />}
              >
                Depositar {formatEth(property.priceEth)}
              </Button>
            </>
          )
        }
      >
        <ul className="space-y-2 rounded-control bg-surface-muted p-4 text-sm text-ink-soft">
          <li>
            <strong className="text-ink">Propiedad:</strong> {property.title}
          </li>
          <li>
            <strong className="text-ink">Vendedor:</strong>{' '}
            <span className="font-mono">{shortenAddress(property.owner.walletAddress)}</span>
          </li>
          <li>Los fondos quedan bloqueados en el contrato, no los recibe el vendedor todavía.</li>
          <li>Cuando recibas la propiedad, confirmas la entrega y el pago se libera al vendedor.</li>
          <li>
            Si no hay entrega, podrás reclamar el reembolso pasados {DELIVERY_PERIOD_DAYS} días (o antes, si el vendedor
            te reembolsa).
          </li>
        </ul>
        {pendingTx && (
          <p className="mt-3 text-xs text-ink-muted">
            Transacción del depósito: <TxLink hash={pendingTx} />
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-control border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700"
          >
            {error}
          </p>
        )}
      </Modal>
    </>
  );
}
