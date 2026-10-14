import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { keccak256, parseEther, toUtf8Bytes } from 'ethers';

// Estado simulado de la red y del contrato.
const chain = {
  chainId: BigInt(11155111),
  listing: [BigInt(0), false] as [bigint, boolean],
  calls: [] as Array<[string, unknown[]]>,
};

vi.mock('ethers', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ethers')>();
  const tx = (hash: string) => ({ wait: async () => ({ hash }) });
  return {
    ...actual,
    BrowserProvider: class {
      getNetwork = async () => ({ chainId: chain.chainId });
      getSigner = async () => ({});
    },
    Contract: class {
      listings = async (...args: unknown[]) => { chain.calls.push(['listings', args]); return chain.listing; };
      list = async (...args: unknown[]) => { chain.calls.push(['list', args]); return tx('0xlist'); };
      deposit = async (...args: unknown[]) => { chain.calls.push(['deposit', args]); return tx('0xdeposit'); };
      claimRefund = async (...args: unknown[]) => { chain.calls.push(['claimRefund', args]); return tx('0xclaim'); };
    },
  };
});

const ESCROW = '0x049BBA8708b71E33f649Bae0E2F127F805ca9Ca9';
const onchainId = (uuid: string) => BigInt(keccak256(toUtf8Bytes(uuid)));

async function loadModule() {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_ESCROW_ADDRESS', ESCROW);
  vi.stubEnv('NEXT_PUBLIC_CHAIN_ID', '11155111');
  return import('../blockchain');
}

beforeEach(() => {
  chain.chainId = BigInt(11155111);
  chain.listing = [BigInt(0), false];
  chain.calls = [];
  (window as any).ethereum = { request: vi.fn().mockResolvedValue(null) };
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete (window as any).ethereum;
});

describe('getListingState', () => {
  it('"listed" cuando el listado está activo con el precio publicado', async () => {
    chain.listing = [parseEther('1.5'), true];
    const { getListingState } = await loadModule();

    await expect(getListingState('p1', '0xseller', '1.500000')).resolves.toEqual({ status: 'listed' });
    expect(chain.calls[0]).toEqual(['listings', [onchainId('p1'), '0xseller']]);
  });

  it('"not-listed" cuando el vendedor no habilitó la compra', async () => {
    const { getListingState } = await loadModule();
    await expect(getListingState('p1', '0xseller', '1')).resolves.toEqual({ status: 'not-listed' });
  });

  it('"price-mismatch" cuando el precio on-chain es otro', async () => {
    chain.listing = [parseEther('1'), true];
    const { getListingState } = await loadModule();
    await expect(getListingState('p1', '0xseller', '2')).resolves.toEqual({ status: 'price-mismatch' });
  });

  it('"unavailable" si MetaMask está en otra red', async () => {
    chain.chainId = BigInt(1);
    const { getListingState } = await loadModule();
    await expect(getListingState('p1', '0xseller', '1')).resolves.toEqual({
      status: 'unavailable',
      reason: 'MetaMask está en otra red. Cámbiala a Sepolia.',
    });
  });

  it('"unavailable" si MetaMask no está instalado', async () => {
    delete (window as any).ethereum;
    const { getListingState } = await loadModule();
    await expect(getListingState('p1', '0xseller', '1')).resolves.toEqual({
      status: 'unavailable',
      reason: 'MetaMask no está instalado.',
    });
  });
});

describe('transacciones', () => {
  it('list fija el precio en wei para el id derivado del UUID', async () => {
    const { listOnChain } = await loadModule();

    await expect(listOnChain('p1', '0.001')).resolves.toBe('0xlist');
    expect(chain.calls[0]).toEqual(['list', [onchainId('p1'), parseEther('0.001')]]);
  });

  it('deposit envía el precio exacto como value', async () => {
    const { depositEscrow } = await loadModule();

    await expect(depositEscrow('p1', '0xseller', '2')).resolves.toBe('0xdeposit');
    expect(chain.calls[0]).toEqual(['deposit', [onchainId('p1'), '0xseller', { value: parseEther('2') }]]);
  });

  it('pide a MetaMask cambiar a Sepolia antes de firmar', async () => {
    const { claimRefundOnChain } = await loadModule();

    await claimRefundOnChain('p1', '0xseller');

    expect((window as any).ethereum.request).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0xaa36a7' }],
    });
  });

  it('no firma si MetaMask sigue en otra red', async () => {
    chain.chainId = BigInt(1);
    const { depositEscrow } = await loadModule();

    await expect(depositEscrow('p1', '0xseller', '1')).rejects.toThrow('Cámbiala a Sepolia');
    expect(chain.calls).toHaveLength(0);
  });

  it('explica cuando falta la dirección del contrato', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_ESCROW_ADDRESS', '');
    const { depositEscrow } = await import('../blockchain');

    await expect(depositEscrow('p1', '0xseller', '1')).rejects.toThrow('NEXT_PUBLIC_ESCROW_ADDRESS');
  });
});
