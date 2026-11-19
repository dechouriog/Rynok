import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { JsonRpcProvider, Wallet, getBytes, toUtf8String } from 'ethers';

/** Cuentas públicas de prueba de Hardhat. Nunca uses claves reales aquí. */
export const ACCOUNTS = {
  seller: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  buyer: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
} as const;

const RPC_URL = 'http://127.0.0.1:8546';
const provider = new JsonRpcProvider(RPC_URL, 31337, { staticNetwork: true });

type MockOptions = { account: keyof typeof ACCOUNTS; chainId?: number };

/**
 * MetaMask simulado: la página recibe un `window.ethereum` EIP-1193 cuyas peticiones se resuelven
 * en Node. Las firmas y transacciones las hace una wallet real de ethers contra el nodo Hardhat, así
 * que el contrato, el backend y la UI se ejercitan de verdad; solo se omite la ventana de MetaMask.
 */
export async function installMetaMask(context: BrowserContext, { account, chainId = 31337 }: MockOptions) {
  await skipOnboarding(context);
  const wallet = new Wallet(ACCOUNTS[account], provider);
  // Serializa los envíos para que los nonces no se pisen.
  let queue: Promise<unknown> = Promise.resolve();

  await context.exposeBinding('__rynokWallet', async (_source, method: string, params: unknown[]) => {
    switch (method) {
      case 'eth_requestAccounts':
      case 'eth_accounts':
        return [wallet.address];
      case 'eth_chainId':
        return `0x${chainId.toString(16)}`;
      case 'net_version':
        return String(chainId);
      case 'wallet_switchEthereumChain':
      case 'wallet_addEthereumChain':
        return null;
      case 'personal_sign': {
        const [data] = params as [string];
        const message = data.startsWith('0x') ? toUtf8String(getBytes(data)) : data;
        return wallet.signMessage(message);
      }
      case 'eth_sendTransaction': {
        const [tx] = params as [{ to: string; data?: string; value?: string; gas?: string }];
        const send = queue.then(() =>
          wallet
            .sendTransaction({ to: tx.to, data: tx.data, value: tx.value ? BigInt(tx.value) : 0n })
            .then((sent) => sent.hash),
        );
        queue = send.catch(() => undefined);
        return send;
      }
      default:
        return provider.send(method, params ?? []);
    }
  });

  await context.addInitScript(() => {
    type Binding = (method: string, params: unknown[]) => Promise<unknown>;
    const call = (window as unknown as { __rynokWallet: Binding }).__rynokWallet;
    (window as unknown as { ethereum: unknown }).ethereum = {
      isMetaMask: true,
      request: ({ method, params }: { method: string; params?: unknown[] }) => call(method, params ?? []),
      on: () => undefined,
      removeListener: () => undefined,
    };
  });
  return wallet.address.toLowerCase();
}

/** Conecta la wallet desde la UI (firma el mensaje de inicio de sesión). */
export async function connectFromNavbar(page: Page) {
  await page.getByRole('banner').getByRole('button', { name: 'Conectar wallet' }).click();
  await page
    .getByRole('banner')
    .getByRole('link', { name: /Wallet conectada/ })
    .waitFor();
}

/** La guía de bienvenida se prueba en las unitarias; en e2e no debe tapar la interfaz. */
export function skipOnboarding(context: BrowserContext) {
  return context.addInitScript(() => {
    try {
      window.localStorage.setItem('rynok_onboarding_seen', 'true');
    } catch {
      // about:blank y otros documentos sin acceso a localStorage
    }
  });
}

export const test = base.extend({
  context: async ({ context }, use) => {
    await skipOnboarding(context);
    await use(context);
  },
});
export { expect } from '@playwright/test';
