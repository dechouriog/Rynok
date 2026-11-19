'use client';
import { useEffect, useState } from 'react';
import { BrowserProvider, formatEther } from 'ethers';
import { Check, Copy, LogOut, Network, Wallet as WalletIcon } from 'lucide-react';
import { useWallet } from '@/context/WalletContext';
import { CHAIN, getEthereum } from '@/lib/blockchain';
import { formatDate } from '@/lib/format';
import { tokenExpiresAt } from '@/lib/session-store';
import { Badge, Button, Card, Modal } from '@/components/ui';

export function WalletView() {
  const { address, token, chainId, isWrongNetwork, switchNetwork, disconnect } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth || !address || isWrongNetwork) return;
    let cancelled = false;
    new BrowserProvider(eth)
      .getBalance(address)
      .then(
        (wei) =>
          !cancelled && setBalance(Number(formatEther(wei)).toLocaleString('es-CO', { maximumFractionDigits: 4 })),
      )
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [address, isWrongNetwork, chainId]);

  if (!address) return null;
  const expiresAt = token ? tokenExpiresAt(token) : null;

  async function copy() {
    await navigator.clipboard.writeText(address ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-start gap-4">
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-600"
            aria-hidden
          >
            <WalletIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink-muted">Wallet conectada</p>
            <p className="break-all font-mono text-sm font-semibold text-ink">{address}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copy}
                icon={copied ? <Check className="h-4 w-4" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
              >
                {copied ? 'Copiada' : 'Copiar dirección'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmLogout(true)}
                icon={<LogOut className="h-4 w-4" aria-hidden />}
              >
                Cerrar sesión
              </Button>
            </div>
            <p className="sr-only" aria-live="polite">
              {copied ? 'Dirección copiada al portapapeles' : ''}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="flex items-center gap-2 text-sm text-ink-muted">
            <Network className="h-4 w-4" aria-hidden /> Red
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {isWrongNetwork ? (
              <>
                <Badge tone="warning">Red equivocada (chain {chainId})</Badge>
                <Button size="sm" onClick={switchNetwork}>
                  Cambiar a {CHAIN.name}
                </Button>
              </>
            ) : (
              <Badge tone="success">{CHAIN.name}</Badge>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-ink-muted">Saldo</p>
          <p className="mt-2 text-2xl font-bold text-ink">
            {isWrongNetwork ? '—' : balance === null ? '…' : `${balance} ETH`}
          </p>
        </Card>
      </div>

      {expiresAt && (
        <p className="text-xs text-ink-muted">
          Tu sesión en Rynok vence el {formatDate(new Date(expiresAt))}. Luego te pediremos firmar de nuevo.
        </p>
      )}

      <Modal
        open={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="¿Cerrar sesión?"
        description="Tu wallet sigue en MetaMask; solo cerraremos la sesión en Rynok en este navegador."
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmLogout(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setConfirmLogout(false);
                disconnect();
              }}
            >
              Cerrar sesión
            </Button>
          </>
        }
      />
    </div>
  );
}
