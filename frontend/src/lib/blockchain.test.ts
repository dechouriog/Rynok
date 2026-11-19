import { describe, it, expect, vi } from 'vitest';
import { JsonRpcProvider, keccak256, makeError, parseEther, toUtf8Bytes } from 'ethers';
import {
  CHAIN,
  DELIVERY_PERIOD_MS,
  UserFacingError,
  depositEscrow,
  describeTxError,
  escrowPropertyId,
  explorerTxUrl,
  getChainId,
  getListingState,
  isEscrowConfigured,
  switchToExpectedChain,
} from './blockchain';
import type { Eip1193Provider } from '@/types/ethereum';

const SELLER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const PROPERTY = '09daa0ae-8cd2-4416-8156-fe4328c701a2';

/** MetaMask falso que responde eth_chainId y las llamadas de lectura al contrato. */
function fakeEthereum(callResult: (data: string) => string) {
  const request = vi.fn(async ({ method, params }: { method: string; params?: unknown }) => {
    if (method === 'eth_chainId') return '0x7a69';
    if (method === 'eth_call') return callResult((params as [{ data: string }])[0].data);
    throw new Error(`no simulado: ${method}`);
  });
  window.ethereum = { request } as unknown as Eip1193Provider;
  return request;
}

const encodeListing = (price: bigint, active: boolean) =>
  `0x${price.toString(16).padStart(64, '0')}${(active ? 1n : 0n).toString(16).padStart(64, '0')}`;

describe('configuración', () => {
  it('usa la red y el contrato de las variables de entorno', () => {
    expect(CHAIN).toMatchObject({ id: 31337, hexId: '0x7a69', name: 'Hardhat local' });
    expect(isEscrowConfigured).toBe(true);
    expect(explorerTxUrl('0xabc')).toBeNull();
    expect(DELIVERY_PERIOD_MS).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('escrowPropertyId usa el mismo hash que el backend', () => {
    expect(escrowPropertyId(PROPERTY)).toBe(BigInt(keccak256(toUtf8Bytes(PROPERTY))));
  });
});

describe('getListingState', () => {
  it('habilitada solo si está activa y con el precio publicado', async () => {
    fakeEthereum(() => encodeListing(parseEther('2.5'), true));
    await expect(getListingState(PROPERTY, SELLER, '2.5')).resolves.toEqual({ status: 'listed' });
    await expect(getListingState(PROPERTY, SELLER, '3')).resolves.toEqual({ status: 'price-mismatch' });
  });

  it('no listada si el contrato no tiene registro activo', async () => {
    fakeEthereum(() => encodeListing(0n, false));
    await expect(getListingState(PROPERTY, SELLER, '2.5')).resolves.toEqual({ status: 'not-listed' });
  });

  it('informa cuando no puede leer el contrato (MetaMask y RPC de respaldo caídos)', async () => {
    window.ethereum = { request: vi.fn().mockRejectedValue(new Error('rpc caído')) };
    // Sin esto la prueba dependería de que no haya un nodo real escuchando en el RPC por defecto.
    const send = vi.spyOn(JsonRpcProvider.prototype, 'send').mockRejectedValue(new Error('sin red'));
    await expect(getListingState(PROPERTY, SELLER, '2.5')).resolves.toMatchObject({ status: 'unavailable' });
    expect(send).toHaveBeenCalled();
    send.mockRestore();
  });

  it('consulta listings(id, vendedor) con el id del contrato', async () => {
    const request = fakeEthereum(() => encodeListing(parseEther('1'), true));
    await getListingState(PROPERTY, SELLER, '1');
    const call = request.mock.calls.find(([arg]) => arg.method === 'eth_call')![0] as { params: [{ data: string }] };
    expect(call.params[0].data).toContain(escrowPropertyId(PROPERTY).toString(16));
    expect(call.params[0].data).toContain(SELLER.slice(2));
  });
});

describe('describeTxError', () => {
  it('traduce rechazos, saldo, red y solicitudes pendientes', () => {
    expect(
      describeTxError(makeError('rechazado', 'ACTION_REJECTED', { action: 'sendTransaction', reason: 'rejected' })),
    ).toMatch(/Rechazaste/);
    expect(describeTxError({ code: 4001 })).toMatch(/Rechazaste/);
    expect(describeTxError(makeError('sin fondos', 'INSUFFICIENT_FUNDS', { transaction: {} }))).toMatch(
      /Saldo insuficiente/,
    );
    expect(describeTxError(makeError('red', 'NETWORK_ERROR', { event: 'x' }))).toMatch(/conectar con la red/);
    expect(describeTxError({ code: -32002 })).toMatch(/solicitud pendiente/);
    expect(describeTxError(new UserFacingError('Mensaje propio'))).toBe('Mensaje propio');
    expect(describeTxError(new Error('???'))).toMatch(/no se pudo completar/);
  });

  it('muestra el motivo del require del contrato', () => {
    expect(describeTxError({ reason: 'El monto debe ser igual al precio' })).toBe(
      'El contrato rechazó la operación: El monto debe ser igual al precio.',
    );
    expect(describeTxError({ revert: { args: ['No hay un deposito pendiente'] } })).toMatch(
      /No hay un deposito pendiente/,
    );
  });
});

describe('red de MetaMask', () => {
  it('lee el chainId y cambia de red', async () => {
    const request = vi.fn().mockResolvedValueOnce('0xaa36a7').mockResolvedValue(null);
    const eth = { request } as unknown as Eip1193Provider;
    expect(await getChainId(eth)).toBe(11155111);
    await switchToExpectedChain(eth);
    expect(request).toHaveBeenLastCalledWith({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x7a69' }] });
  });

  it('agrega la red si MetaMask no la conoce (4902) y propaga otros errores', async () => {
    const request = vi.fn().mockRejectedValueOnce({ code: 4902 }).mockResolvedValueOnce(null);
    await switchToExpectedChain({ request } as unknown as Eip1193Provider);
    expect(request.mock.calls[1][0]).toMatchObject({ method: 'wallet_addEthereumChain' });
    const failing = vi.fn().mockRejectedValue({ code: 4001 });
    await expect(switchToExpectedChain({ request: failing } as unknown as Eip1193Provider)).rejects.toEqual({
      code: 4001,
    });
  });

  it('sin MetaMask, las transacciones fallan con un mensaje claro', async () => {
    await expect(depositEscrow(PROPERTY, SELLER, '1')).rejects.toThrow(/Instala MetaMask/);
  });
});
