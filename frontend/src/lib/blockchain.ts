import { BrowserProvider, Contract, parseEther } from 'ethers';

const ESCROW_ADDRESS = process.env.NEXT_PUBLIC_ESCROW_ADDRESS!;
const ESCROW_ABI = [
  'function deposit(uint256 propertyId, address seller) external payable',
  'function confirmDelivery(uint256 propertyId) external',
  'event Deposited(uint256 indexed propertyId, address indexed buyer, address indexed seller, uint256 amount)',
];

function propertyIdToUint256(propertyId: string): bigint {
  // Mismo hash que usa el backend/tests para mapear el UUID a un id numérico del contrato.
  const { keccak256, toUtf8Bytes } = require('ethers');
  return BigInt(keccak256(toUtf8Bytes(propertyId)));
}

export async function depositEscrow(propertyId: string, sellerAddress: string, amountEth: string) {
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

  const tx = await contract.deposit(propertyIdToUint256(propertyId), sellerAddress, {
    value: parseEther(amountEth),
  });
  const receipt = await tx.wait();
  return receipt.hash as string;
}

export async function confirmDeliveryOnChain(propertyId: string) {
  const provider = new BrowserProvider((window as any).ethereum);
  const signer = await provider.getSigner();
  const contract = new Contract(ESCROW_ADDRESS, ESCROW_ABI, signer);

  const tx = await contract.confirmDelivery(propertyIdToUint256(propertyId));
  const receipt = await tx.wait();
  return receipt.hash as string;
}