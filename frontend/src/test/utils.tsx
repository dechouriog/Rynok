import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { vi } from 'vitest';
import { Wallet, getBytes, hexlify, toUtf8Bytes } from 'ethers';
import { ToastProvider } from '@/components/ui/Toast';
import { WalletProvider } from '@/context/WalletContext';
import { sessionStore } from '@/lib/session-store';
import type { Property, EscrowTransaction } from '@/lib/api';
import type { Eip1193Provider } from '@/types/ethereum';

export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(
    <ToastProvider>
      <WalletProvider>{ui}</WalletProvider>
    </ToastProvider>,
    options,
  );
}

/** JWT sin firma válida pero con `exp`, suficiente para el cliente (que solo lee la expiración). */
export function fakeJwt(expiresInSeconds = 3600): string {
  const payload = btoa(JSON.stringify({ sub: 'u1', exp: Math.floor(Date.now() / 1000) + expiresInSeconds }));
  return `header.${payload.replace(/=+$/, '')}.signature`;
}

export function startSession(address: string, token = fakeJwt()) {
  sessionStore.set({ token, address: address.toLowerCase() });
}

/** Cuenta #1 pública de Hardhat (solo pruebas). Wallet.createRandom no funciona en jsdom. */
export const BUYER_KEY = '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

type FakeEthereumOptions = { chainId?: number; wallet?: Wallet; rejectSign?: boolean };

/**
 * Proveedor EIP-1193 falso respaldado por una wallet real de ethers: las firmas son verificables.
 * Permite emitir eventos (`accountsChanged`, `chainChanged`) desde las pruebas.
 */
export function installFakeEthereum({
  chainId = 31337,
  wallet = new Wallet(BUYER_KEY),
  rejectSign = false,
}: FakeEthereumOptions = {}) {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  let currentChain = chainId;
  const request = vi.fn(async ({ method, params }: { method: string; params?: unknown }) => {
    const args = (params ?? []) as unknown[];
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return [wallet.address];
      case 'eth_chainId':
        return `0x${currentChain.toString(16)}`;
      case 'personal_sign': {
        if (rejectSign) throw Object.assign(new Error('User rejected the request.'), { code: 4001 });
        const message = args[0] as string;
        return wallet.signMessage(message.startsWith('0x') ? getBytes(message) : message);
      }
      case 'wallet_switchEthereumChain':
        currentChain = Number.parseInt((args[0] as { chainId: string }).chainId, 16);
        listeners.get('chainChanged')?.forEach((l) => l(`0x${currentChain.toString(16)}`));
        return null;
      default:
        throw new Error(`Método no simulado: ${method}`);
    }
  });
  const ethereum: Eip1193Provider = {
    request: request as Eip1193Provider['request'],
    on: (event, listener) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(listener);
    },
    removeListener: (event, listener) => listeners.get(event)?.delete(listener),
  };
  window.ethereum = ethereum;
  return {
    ethereum,
    request,
    wallet,
    emit: (event: string, ...args: unknown[]) => listeners.get(event)?.forEach((l) => l(...args)),
    setChain: (id: number) => {
      currentChain = id;
    },
  };
}

export const toHexMessage = (text: string) => hexlify(toUtf8Bytes(text));

export const SELLER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
export const BUYER = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';

export function makeProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: '09daa0ae-8cd2-4416-8156-fe4328c701a2',
    title: 'Apartamento en El Poblado',
    description: 'Tres habitaciones, balcón y parqueadero cubierto.',
    location: 'Medellín',
    priceEth: '2.5',
    imageUrl: null,
    status: 'AVAILABLE',
    owner: { id: 'seller-1', walletAddress: SELLER },
    createdAt: '2026-11-01T12:00:00.000Z',
    ...overrides,
  };
}

export function makeTransaction(overrides: Partial<EscrowTransaction> = {}): EscrowTransaction {
  const property = makeProperty({ status: 'IN_ESCROW' });
  return {
    id: 'tx-1',
    propertyId: property.id,
    property,
    buyerWallet: BUYER,
    sellerWallet: SELLER,
    amountEth: '2.5',
    contractAddress: '0x049bba8708b71e33f649bae0e2f127f805ca9ca9',
    status: 'AWAITING_DELIVERY',
    depositTxHash: `0x${'ab'.repeat(32)}`,
    releaseTxHash: null,
    refundTxHash: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}
