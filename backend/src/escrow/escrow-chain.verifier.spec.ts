import { describe, it, expect, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { Interface, parseEther } from 'ethers';
import { EscrowChainVerifier, escrowPropertyId } from './escrow-chain.verifier.js';

const CONTRACT = '0x049bba8708b71e33f649bae0e2f127f805ca9ca9';
const OTHER_CONTRACT = '0x0000000000000000000000000000000000000c02';
const BUYER = '0x00000000000000000000000000000000000000b1';
const SELLER = '0x00000000000000000000000000000000000000d1';
const PROPERTY = '6f1c1c7e-2f7a-4a39-9d5e-3f8a1b2c4d5e';
const HASH = `0x${'a'.repeat(64)}`;

const events = new Interface([
  'event Deposited(uint256 indexed propertyId, address indexed buyer, address indexed seller, uint256 amount)',
  'event Released(uint256 indexed propertyId, address indexed seller)',
]);

function log(address: string, name: string, args: unknown[]) {
  const fragment = events.getEvent(name)!;
  return { address, ...events.encodeEventLog(fragment, args) };
}

function verifierWith(
  receipt: unknown,
  env: Record<string, string> = { ESCROW_RPC_URL: 'http://rpc', ESCROW_CONTRACT_ADDRESS: CONTRACT },
) {
  const verifier = new EscrowChainVerifier({ get: (key: string) => env[key] } as any);
  (verifier as any).provider = env.ESCROW_RPC_URL
    ? { getTransactionReceipt: vi.fn().mockResolvedValue(receipt) }
    : undefined;
  return verifier;
}

const depositLog = (overrides: Partial<{ property: string; buyer: string; seller: string; amount: bigint }> = {}) =>
  log(CONTRACT, 'Deposited', [
    escrowPropertyId(overrides.property ?? PROPERTY),
    overrides.buyer ?? BUYER,
    overrides.seller ?? SELLER,
    overrides.amount ?? parseEther('1'),
  ]);

const expected = { buyer: BUYER, seller: SELLER, amount: parseEther('1') };

describe('EscrowChainVerifier', () => {
  it('acepta un depósito real con los datos esperados', async () => {
    const verifier = verifierWith({ status: 1, logs: [depositLog()] });
    await expect(verifier.assertEvent(HASH, CONTRACT, 'Deposited', PROPERTY, expected)).resolves.toBeUndefined();
  });

  it('rechaza una transacción inexistente o fallida', async () => {
    await expect(
      verifierWith(null).assertEvent(HASH, CONTRACT, 'Deposited', PROPERTY, expected),
    ).rejects.toThrow('no existe o no fue exitosa');
    await expect(
      verifierWith({ status: 0, logs: [depositLog()] }).assertEvent(HASH, CONTRACT, 'Deposited', PROPERTY, expected),
    ).rejects.toThrow('no existe o no fue exitosa');
  });

  it.each([
    ['otra propiedad', { property: '00000000-0000-0000-0000-000000000000' }],
    ['otro comprador', { buyer: '0x00000000000000000000000000000000000000b2' }],
    ['otro vendedor (ataque de 1 wei)', { seller: '0x00000000000000000000000000000000000000d2' }],
    ['otro monto', { amount: BigInt(1) }],
  ])('rechaza un depósito de %s', async (_, overrides) => {
    const verifier = verifierWith({ status: 1, logs: [depositLog(overrides)] });
    await expect(
      verifier.assertEvent(HASH, CONTRACT, 'Deposited', PROPERTY, expected),
    ).rejects.toThrow(BadRequestException);
  });

  it('ignora eventos emitidos por otro contrato', async () => {
    const fake = { ...depositLog(), address: OTHER_CONTRACT };
    const verifier = verifierWith({ status: 1, logs: [fake] });
    await expect(verifier.assertEvent(HASH, CONTRACT, 'Deposited', PROPERTY, expected)).rejects.toThrow(
      'no contiene el evento Deposited',
    );
  });

  it('rechaza un evento distinto al esperado', async () => {
    const verifier = verifierWith({ status: 1, logs: [log(CONTRACT, 'Released', [escrowPropertyId(PROPERTY), SELLER])] });
    await expect(verifier.assertEvent(HASH, CONTRACT, 'Deposited', PROPERTY, expected)).rejects.toThrow(
      'no contiene el evento Deposited',
    );
  });

  it('rechaza una dirección de contrato distinta a la configurada', async () => {
    const verifier = verifierWith({ status: 1, logs: [depositLog()] });
    await expect(verifier.assertEvent(HASH, OTHER_CONTRACT, 'Deposited', PROPERTY, expected)).rejects.toThrow(
      'no es la configurada',
    );
  });

  it('sin ESCROW_RPC_URL omite la verificación on-chain', async () => {
    const verifier = verifierWith(null, {});
    await expect(verifier.assertEvent(HASH, CONTRACT, 'Deposited', PROPERTY, expected)).resolves.toBeUndefined();
  });
});
