import { BrowserProvider, Contract, keccak256, parseEther, toUtf8Bytes } from 'ethers';

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS ?? '';
// Red donde está desplegado el contrato: Sepolia por defecto, 31337 para el nodo local de Hardhat.
const CHAIN_ID = BigInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');
const CHAIN_NAME = CHAIN_ID === BigInt(11155111) ? 'Sepolia' : `la red ${CHAIN_ID}`;
const ESCROW_ABI = [
  'function list(uint256 propertyId, uint256 price) external',
  'function deposit(uint256 propertyId, address seller) external payable',
  'function confirmDelivery(uint256 propertyId, address seller) external',
  'function refund(uint256 propertyId, address seller) external',
  'function claimRefund(uint256 propertyId, address seller) external',
  'function listings(uint256 propertyId, address seller) view returns (uint256 price, bool active)',
];

/** Debe coincidir con Escrow.DELIVERY_PERIOD (30 días). */
export const DELIVERY_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

export function escrowContractAddress() {
  return ESCROW_ADDRESS;
}

function propertyIdToUint256(propertyId: string): bigint {
  // Mismo hash que usa el backend/tests para mapear el UUID a un id numérico del contrato.
  return BigInt(keccak256(toUtf8Bytes(propertyId)));
}

function getProvider() {
  if (!ESCROW_ADDRESS) {
    throw new Error('Falta configurar NEXT_PUBLIC_ESCROW_ADDRESS con la dirección del contrato de escrow.');
  }
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('MetaMask no está instalado.');
  }
  return new BrowserProvider((window as any).ethereum);
}

async function assertNetwork(provider: BrowserProvider) {
  const { chainId } = await provider.getNetwork();
  if (chainId !== CHAIN_ID) {
    throw new Error(`MetaMask está en otra red. Cámbiala a ${CHAIN_NAME}.`);
  }
}

async function getEscrowContract() {
  // Antes de firmar, pide a MetaMask cambiar a la red del contrato.
  const ethereum = (window as any).ethereum;
  try {
    await ethereum?.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${CHAIN_ID.toString(16)}` }],
    });
  } catch {
    // Si el usuario lo rechaza, assertNetwork da el mensaje claro.
  }
  const provider = getProvider();
  await assertNetwork(provider);
  const signer = await provider.getSigner();
  return new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);
}

async function send(txPromise: Promise<any>) {
  const tx = await txPromise;
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export type ListingState =
  | { status: 'listed' | 'not-listed' | 'price-mismatch' }
  | { status: 'unavailable'; reason: string };

/**
 * Estado on-chain de la venta: habilitada solo si el vendedor llamó a
 * `list` con exactamente el precio publicado en Rynok.
 */
export async function getListingState(
  propertyId: string,
  sellerAddress: string,
  priceEth: string,
): Promise<ListingState> {
  try {
    const provider = getProvider();
    await assertNetwork(provider);
    const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, provider);
    const [price, active] = await contract.listings(propertyIdToUint256(propertyId), sellerAddress);
    if (!active) return { status: 'not-listed' };
    return { status: price === parseEther(priceEth) ? 'listed' : 'price-mismatch' };
  } catch (err: any) {
    return { status: 'unavailable', reason: err?.shortMessage ?? err?.message ?? 'No se pudo leer el contrato' };
  }
}

export async function listOnChain(propertyId: string, priceEth: string) {
  const contract = await getEscrowContract();
  return send(contract.list(propertyIdToUint256(propertyId), parseEther(priceEth)));
}

export async function depositEscrow(propertyId: string, sellerAddress: string, amountEth: string) {
  const contract = await getEscrowContract();
  return send(contract.deposit(propertyIdToUint256(propertyId), sellerAddress, {
    value: parseEther(amountEth),
  }));
}

export async function confirmDeliveryOnChain(propertyId: string, sellerAddress: string) {
  const contract = await getEscrowContract();
  return send(contract.confirmDelivery(propertyIdToUint256(propertyId), sellerAddress));
}

export async function refundOnChain(propertyId: string, sellerAddress: string) {
  const contract = await getEscrowContract();
  return send(contract.refund(propertyIdToUint256(propertyId), sellerAddress));
}

export async function claimRefundOnChain(propertyId: string, sellerAddress: string) {
  const contract = await getEscrowContract();
  return send(contract.claimRefund(propertyIdToUint256(propertyId), sellerAddress));
}
