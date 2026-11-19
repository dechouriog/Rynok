/**
 * Todo lo que el frontend hace con la blockchain: red esperada, contrato Escrow (contracts/contracts/Escrow.sol),
 * lectura del estado en cadena, envío de transacciones y traducción de errores al español.
 */
import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  isAddress,
  isError,
  keccak256,
  parseEther,
  toUtf8Bytes,
  type ContractRunner,
} from 'ethers';
import type { Eip1193Provider } from '@/types/ethereum';

type ChainPreset = { name: string; rpcUrl: string; explorer?: string };
const PRESETS: Record<number, ChainPreset> = {
  11155111: {
    name: 'Sepolia',
    rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
    explorer: 'https://sepolia.etherscan.io',
  },
  31337: { name: 'Hardhat local', rpcUrl: 'http://127.0.0.1:8545' },
};

const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 11155111);
const preset = PRESETS[chainId] ?? { name: `Red ${chainId}`, rpcUrl: '' };

export const CHAIN = {
  id: chainId,
  hexId: `0x${chainId.toString(16)}`,
  name: preset.name,
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || preset.rpcUrl,
  explorer: preset.explorer,
} as const;

export const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? '';
export const isEscrowConfigured = isAddress(ESCROW_ADDRESS);

/** Debe coincidir con Escrow.DELIVERY_PERIOD (30 días). */
export const DELIVERY_PERIOD_DAYS = 30;
export const DELIVERY_PERIOD_MS = DELIVERY_PERIOD_DAYS * 24 * 60 * 60 * 1000;

export const ESCROW_ABI = [
  'function list(uint256 propertyId, uint256 price) external',
  'function deposit(uint256 propertyId, address seller) external payable',
  'function confirmDelivery(uint256 propertyId, address seller) external',
  'function refund(uint256 propertyId, address seller) external',
  'function claimRefund(uint256 propertyId, address seller) external',
  'function listings(uint256 propertyId, address seller) view returns (uint256 price, bool active)',
] as const;

/** UUID → uint256 del contrato. Mismo hash que backend/src/escrow/escrow-chain.verifier.ts. */
export function escrowPropertyId(propertyId: string): bigint {
  return BigInt(keccak256(toUtf8Bytes(propertyId)));
}

export function getEthereum(): Eip1193Provider | null {
  return typeof window !== 'undefined' ? (window.ethereum ?? null) : null;
}

export function explorerTxUrl(hash: string): string | null {
  return CHAIN.explorer ? `${CHAIN.explorer}/tx/${hash}` : null;
}

/** Error con un mensaje ya pensado para mostrarse a la persona usuaria. */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserFacingError';
  }
}

// ------------------------------------------------------------------ red

export async function getChainId(eth: Eip1193Provider): Promise<number> {
  return Number.parseInt(String(await eth.request({ method: 'eth_chainId' })), 16);
}

/** Pide a MetaMask cambiar a la red esperada y, si no la conoce, agregarla. */
export async function switchToExpectedChain(eth: Eip1193Provider): Promise<void> {
  try {
    await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: CHAIN.hexId }] });
  } catch (error) {
    if ((error as { code?: number }).code !== 4902) throw error;
    await eth.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: CHAIN.hexId,
          chainName: CHAIN.name,
          rpcUrls: [CHAIN.rpcUrl],
          nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
          ...(CHAIN.explorer ? { blockExplorerUrls: [CHAIN.explorer] } : {}),
        },
      ],
    });
  }
}

async function readyEthereum(): Promise<Eip1193Provider> {
  const eth = getEthereum();
  if (!eth) throw new UserFacingError('Instala MetaMask para comprar o vender propiedades.');
  if (!isEscrowConfigured) throw new UserFacingError('El contrato de escrow no está configurado en esta instalación.');
  if ((await getChainId(eth)) !== CHAIN.id) {
    await switchToExpectedChain(eth);
    if ((await getChainId(eth)) !== CHAIN.id) {
      throw new UserFacingError(`Cambia MetaMask a la red ${CHAIN.name} para continuar.`);
    }
  }
  return eth;
}

function escrow(runner: ContractRunner) {
  return new Contract(ESCROW_ADDRESS, ESCROW_ABI, runner);
}

async function escrowWithSigner() {
  const provider = new BrowserProvider(await readyEthereum());
  const signer = await provider.getSigner();
  return { contract: escrow(signer), signer, provider };
}

/** Lectura: con MetaMask en la red correcta usa su proveedor; si no, el RPC público de la red. */
async function readProvider(): Promise<ContractRunner> {
  const eth = getEthereum();
  if (eth && (await getChainId(eth).catch(() => null)) === CHAIN.id) return new BrowserProvider(eth);
  return new JsonRpcProvider(CHAIN.rpcUrl, CHAIN.id, { staticNetwork: true });
}

// ------------------------------------------------------------- lectura

export type ListingState =
  { status: 'listed' | 'not-listed' | 'price-mismatch' } | { status: 'unavailable'; reason: string };

/**
 * Estado on-chain de la venta: habilitada solo si el vendedor llamó a `list` con exactamente el
 * precio publicado en Rynok. Funciona sin MetaMask (visitantes) leyendo por RPC.
 */
export async function getListingState(
  propertyId: string,
  sellerAddress: string,
  priceEth: string,
): Promise<ListingState> {
  if (!isEscrowConfigured) return { status: 'unavailable', reason: 'El contrato de escrow no está configurado.' };
  try {
    const contract = escrow(await readProvider());
    const [price, active] = (await contract.listings(escrowPropertyId(propertyId), sellerAddress)) as [bigint, boolean];
    if (!active) return { status: 'not-listed' };
    return { status: price === parseEther(priceEth) ? 'listed' : 'price-mismatch' };
  } catch {
    return { status: 'unavailable', reason: 'No pudimos leer el contrato en este momento.' };
  }
}

// ----------------------------------------------------------- escritura

type Sendable = Promise<{ wait: () => Promise<{ hash: string } | null> }>;

async function send(action: (contract: Contract) => Sendable): Promise<string> {
  const { contract } = await escrowWithSigner();
  const tx = await action(contract);
  const receipt = await tx.wait();
  if (!receipt) throw new UserFacingError('La transacción no se confirmó.');
  return receipt.hash;
}

/** El vendedor habilita (o actualiza el precio de) la venta. */
export function listOnChain(propertyId: string, priceEth: string) {
  return send((c) => c.list(escrowPropertyId(propertyId), parseEther(priceEth)));
}

/** Deposita exactamente el precio. Comprueba antes el saldo para dar un mensaje claro. */
export async function depositEscrow(propertyId: string, sellerAddress: string, priceEth: string): Promise<string> {
  const { contract, signer, provider } = await escrowWithSigner();
  const value = parseEther(priceEth);
  const balance = await provider.getBalance(await signer.getAddress());
  if (balance < value) {
    throw new UserFacingError(`Saldo insuficiente: necesitas ${priceEth} ETH más el gas de la transacción.`);
  }
  const tx = await contract.deposit(escrowPropertyId(propertyId), sellerAddress, { value });
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export function confirmDeliveryOnChain(propertyId: string, sellerAddress: string) {
  return send((c) => c.confirmDelivery(escrowPropertyId(propertyId), sellerAddress));
}

/** El vendedor devuelve los fondos al comprador. */
export function refundOnChain(propertyId: string, sellerAddress: string) {
  return send((c) => c.refund(escrowPropertyId(propertyId), sellerAddress));
}

/** El comprador recupera sus fondos cuando venció el plazo de entrega. */
export function claimRefundOnChain(propertyId: string, sellerAddress: string) {
  return send((c) => c.claimRefund(escrowPropertyId(propertyId), sellerAddress));
}

// -------------------------------------------------------------- errores

/** Mensaje de `require` del contrato (ya está en español), si el error lo trae. */
function revertReason(error: unknown): string | null {
  const candidate = error as { reason?: unknown; revert?: { args?: readonly unknown[] } };
  if (typeof candidate.reason === 'string' && candidate.reason) return candidate.reason;
  const arg = candidate.revert?.args?.[0];
  return typeof arg === 'string' ? arg : null;
}

/** Traduce cualquier error de MetaMask, ethers o del contrato a un mensaje claro en español. */
export function describeTxError(error: unknown): string {
  if (error instanceof UserFacingError) return error.message;
  if (isError(error, 'ACTION_REJECTED') || (error as { code?: number })?.code === 4001) {
    return 'Rechazaste la operación en MetaMask. No se realizó ningún cargo.';
  }
  if (isError(error, 'INSUFFICIENT_FUNDS')) return 'Saldo insuficiente para pagar el precio y el gas.';
  const reason = revertReason(error);
  if (reason) return `El contrato rechazó la operación: ${reason}.`;
  if (isError(error, 'NETWORK_ERROR') || isError(error, 'TIMEOUT')) {
    return 'No se pudo conectar con la red. Revisa tu conexión e inténtalo de nuevo.';
  }
  if ((error as { code?: number })?.code === -32002) {
    return 'MetaMask ya tiene una solicitud pendiente. Ábrelo para continuar.';
  }
  return 'La transacción no se pudo completar. Inténtalo de nuevo.';
}
