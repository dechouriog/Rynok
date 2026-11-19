import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { makeError } from 'ethers';
import * as api from '@/lib/api';
import * as chain from '@/lib/blockchain';
import { BuyButton } from '../BuyButton';
import { PurchasePanel } from './PurchasePanel';
import { OwnerPanel } from './OwnerPanel';
import { TransactionCard } from './TransactionCard';
import {
  installFakeEthereum,
  makeProperty,
  makeTransaction,
  renderWithProviders,
  startSession,
  BUYER,
  SELLER,
} from '@/test/utils';

const push = vi.fn();
const refresh = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ push, refresh }), usePathname: () => '/' }));

vi.mock('@/lib/api', async (original) => ({
  ...(await original<typeof import('@/lib/api')>()),
  getMe: vi.fn().mockResolvedValue({ id: 'u', walletAddress: '0x' }),
  recordEscrowDeposit: vi.fn(),
  confirmEscrowRelease: vi.fn(),
  refundEscrow: vi.fn(),
  deleteProperty: vi.fn(),
  getMyTransactions: vi.fn(),
}));

vi.mock('@/lib/blockchain', async (original) => ({
  ...(await original<typeof import('@/lib/blockchain')>()),
  getListingState: vi.fn(),
  listOnChain: vi.fn(),
  depositEscrow: vi.fn(),
  confirmDeliveryOnChain: vi.fn(),
  refundOnChain: vi.fn(),
  claimRefundOnChain: vi.fn(),
}));

const HASH = `0x${'12'.repeat(32)}`;
const rejected = () => makeError('user rejected', 'ACTION_REJECTED', { action: 'sendTransaction', reason: 'rejected' });

beforeEach(() => {
  installFakeEthereum();
});

describe('BuyButton', () => {
  beforeEach(() => startSession(BUYER));

  it('confirma, deposita al vendedor dueño, registra y lleva a /escrow', async () => {
    vi.mocked(chain.depositEscrow).mockResolvedValue(HASH);
    vi.mocked(api.recordEscrowDeposit).mockResolvedValue(makeTransaction());
    renderWithProviders(<BuyButton property={makeProperty()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Comprar con MetaMask' }));
    const dialog = screen.getByRole('dialog', { name: 'Confirmar compra protegida' });
    expect(within(dialog).getByText(/30 días/)).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('button', { name: /Depositar 2,5 ETH/ }));

    await waitFor(() => expect(push).toHaveBeenCalledWith('/escrow'));
    expect(chain.depositEscrow).toHaveBeenCalledWith(makeProperty().id, SELLER, '2.5');
    expect(api.recordEscrowDeposit).toHaveBeenCalledWith(
      { propertyId: makeProperty().id, amountEth: '2.5', contractAddress: chain.ESCROW_ADDRESS, depositTxHash: HASH },
      expect.any(String),
    );
    expect(screen.getByText('Compra protegida en escrow')).toBeInTheDocument();
  });

  it('si la persona rechaza en MetaMask, explica que no hubo cargo', async () => {
    vi.mocked(chain.depositEscrow).mockRejectedValue(rejected());
    renderWithProviders(<BuyButton property={makeProperty()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Comprar con MetaMask' }));
    await userEvent.click(screen.getByRole('button', { name: /Depositar/ }));
    expect(await screen.findByText(/Rechazaste la operación/)).toBeInTheDocument();
    expect(api.recordEscrowDeposit).not.toHaveBeenCalled();
  });

  it('muestra el motivo del contrato cuando revierte', async () => {
    vi.mocked(chain.depositEscrow).mockRejectedValue({ reason: 'Ya existe un deposito para esta propiedad' });
    renderWithProviders(<BuyButton property={makeProperty()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Comprar con MetaMask' }));
    await userEvent.click(screen.getByRole('button', { name: /Depositar/ }));
    expect(await screen.findByText(/El contrato rechazó la operación: Ya existe un deposito/)).toBeInTheDocument();
  });

  it('si el backend falla tras pagar, permite reintentar el registro sin pagar otra vez', async () => {
    vi.mocked(chain.depositEscrow).mockResolvedValue(HASH);
    vi.mocked(api.recordEscrowDeposit)
      .mockRejectedValueOnce(new api.ApiError(0, api.NETWORK_ERROR_MESSAGE))
      .mockResolvedValueOnce(makeTransaction());
    renderWithProviders(<BuyButton property={makeProperty()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Comprar con MetaMask' }));
    await userEvent.click(screen.getByRole('button', { name: /Depositar/ }));
    expect(await screen.findByText(/Tu pago quedó en el contrato/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar registro' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/escrow'));
    expect(chain.depositEscrow).toHaveBeenCalledTimes(1);
    expect(api.recordEscrowDeposit).toHaveBeenCalledTimes(2);
  });
});

describe('PurchasePanel', () => {
  it('el comprador ve el BuyButton solo si el contrato confirma la venta al precio publicado', async () => {
    startSession(BUYER);
    vi.mocked(chain.getListingState).mockResolvedValue({ status: 'listed' });
    renderWithProviders(<PurchasePanel property={makeProperty()} />);
    expect(screen.getByText(/Verificando el contrato/)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Comprar con MetaMask' })).toBeInTheDocument();
    expect(chain.getListingState).toHaveBeenCalledWith(makeProperty().id, SELLER, '2.5');
  });

  it.each([
    [{ status: 'not-listed' } as const, /aún no habilitó la compra/],
    [{ status: 'price-mismatch' } as const, /no coincide con el publicado/],
    [{ status: 'unavailable', reason: 'No pudimos leer el contrato en este momento.' } as const, /No pudimos leer/],
  ])('sin compra posible en cadena: %o', async (state, text) => {
    vi.mocked(chain.getListingState).mockResolvedValue(state);
    renderWithProviders(<PurchasePanel property={makeProperty()} />);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Comprar con MetaMask' })).not.toBeInTheDocument();
  });

  it.each([
    [makeProperty({ status: 'SOLD' }), /ya se vendió/],
    [makeProperty({ status: 'IN_ESCROW' }), /Otro comprador/],
  ])('estado sin compra posible: %#', async (property, text) => {
    renderWithProviders(<PurchasePanel property={property} />);
    expect(await screen.findByText(text)).toBeInTheDocument();
    expect(chain.getListingState).not.toHaveBeenCalled();
  });

  it('el comprador con fondos en escrow ve el enlace para gestionarlos', async () => {
    startSession(BUYER);
    const property = makeProperty({ status: 'IN_ESCROW' });
    vi.mocked(api.getMyTransactions).mockResolvedValue([makeTransaction({ propertyId: property.id })]);
    renderWithProviders(<PurchasePanel property={property} />);
    expect(await screen.findByRole('link', { name: /Confirmar entrega o reclamar reembolso/ })).toHaveAttribute(
      'href',
      '/escrow',
    );
  });

  it('el dueño ve el panel de vendedor', async () => {
    startSession(SELLER);
    vi.mocked(chain.getListingState).mockResolvedValue({ status: 'not-listed' });
    renderWithProviders(<PurchasePanel property={makeProperty()} />);
    expect(await screen.findByRole('button', { name: 'Habilitar compra' })).toBeInTheDocument();
  });
});

describe('OwnerPanel', () => {
  beforeEach(() => startSession(SELLER));

  it('Habilitar compra: lista en el contrato y vuelve a consultar el estado', async () => {
    vi.mocked(chain.getListingState)
      .mockResolvedValueOnce({ status: 'not-listed' })
      .mockResolvedValue({ status: 'listed' });
    vi.mocked(chain.listOnChain).mockResolvedValue(HASH);
    renderWithProviders(<OwnerPanel property={makeProperty()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Habilitar compra' }));
    expect(await screen.findByText('Compra habilitada en el contrato')).toBeInTheDocument();
    expect(chain.listOnChain).toHaveBeenCalledWith(makeProperty().id, '2.5');
    expect(screen.getByText(/Compra habilitada: ya pueden pagarte/)).toBeInTheDocument();
  });

  it('con precio desactualizado ofrece actualizarlo y muestra errores de MetaMask', async () => {
    vi.mocked(chain.getListingState).mockResolvedValue({ status: 'price-mismatch' });
    vi.mocked(chain.listOnChain).mockRejectedValue(rejected());
    renderWithProviders(<OwnerPanel property={makeProperty()} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Actualizar precio on-chain' }));
    expect(await screen.findByText(/Rechazaste la operación/)).toBeInTheDocument();
  });

  it('Eliminar pide confirmación y avisa si la compra sigue habilitada', async () => {
    vi.mocked(chain.getListingState).mockResolvedValue({ status: 'listed' });
    vi.mocked(api.deleteProperty).mockResolvedValue({ deleted: true });
    renderWithProviders(<OwnerPanel property={makeProperty()} />);
    await screen.findByText('Compra habilitada en el contrato');
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(screen.getByText(/el registro en cadena permanece/)).toBeInTheDocument();
    expect(api.deleteProperty).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/dashboard'));
  });

  it('si eliminar falla, lo informa', async () => {
    vi.mocked(chain.getListingState).mockResolvedValue({ status: 'not-listed' });
    vi.mocked(api.deleteProperty).mockRejectedValue(
      new api.ApiError(409, 'No se puede eliminar una propiedad con fondos en escrow'),
    );
    renderWithProviders(<OwnerPanel property={makeProperty()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, eliminar' }));
    expect(await screen.findByText(/con fondos en escrow/)).toBeInTheDocument();
  });

  it('con fondos en escrow enlaza a la operación y no deja editar ni eliminar', () => {
    renderWithProviders(<OwnerPanel property={makeProperty({ status: 'IN_ESCROW' })} />);
    expect(screen.getByRole('link', { name: 'Ver operación' })).toHaveAttribute('href', '/escrow');
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeDisabled();
    expect(chain.getListingState).not.toHaveBeenCalled();
  });
});

describe('TransactionCard', () => {
  it('el comprador confirma la entrega con doble confirmación', async () => {
    startSession(BUYER);
    const onChanged = vi.fn();
    vi.mocked(chain.confirmDeliveryOnChain).mockResolvedValue(HASH);
    vi.mocked(api.confirmEscrowRelease).mockResolvedValue(makeTransaction({ status: 'COMPLETE' }));
    renderWithProviders(<TransactionCard tx={makeTransaction()} role="buyer" onChanged={onChanged} />);

    expect(screen.getByRole('button', { name: 'Reclamar reembolso' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar entrega' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, liberar el pago' }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(chain.confirmDeliveryOnChain).toHaveBeenCalledWith(makeProperty().id, SELLER);
    expect(api.confirmEscrowRelease).toHaveBeenCalledWith(makeProperty().id, HASH, expect.any(String));
  });

  it('vencido el plazo de 30 días, el comprador reclama el reembolso', async () => {
    startSession(BUYER);
    vi.mocked(chain.claimRefundOnChain).mockResolvedValue(HASH);
    vi.mocked(api.refundEscrow).mockResolvedValue(makeTransaction({ status: 'REFUNDED' }));
    const tx = makeTransaction({ createdAt: new Date(Date.now() - 31 * 86_400_000).toISOString() });
    renderWithProviders(<TransactionCard tx={tx} role="buyer" onChanged={vi.fn()} />);
    expect(screen.getByText(/Venció el plazo de 30 días/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reclamar reembolso' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Reclamar reembolso' }).at(-1)!);
    await waitFor(() => expect(api.refundEscrow).toHaveBeenCalledWith(makeProperty().id, HASH, expect.any(String)));
  });

  it('el vendedor reembolsa; los errores del contrato se notifican', async () => {
    startSession(SELLER);
    vi.mocked(chain.refundOnChain).mockRejectedValue({ reason: 'No hay un deposito pendiente' });
    renderWithProviders(<TransactionCard tx={makeTransaction()} role="seller" onChanged={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Reembolsar al comprador' }));
    await userEvent.click(screen.getByRole('button', { name: 'Sí, devolver los fondos' }));
    expect(await screen.findByText(/No hay un deposito pendiente/)).toBeInTheDocument();
  });

  it('una operación liquidada no tiene acciones; una propiedad eliminada se indica', () => {
    renderWithProviders(
      <TransactionCard
        tx={makeTransaction({ status: 'COMPLETE', releaseTxHash: HASH, property: null })}
        role="seller"
        onChanged={vi.fn()}
      />,
    );
    expect(screen.getByText('Completada')).toBeInTheDocument();
    expect(screen.getByText('Liberación')).toBeInTheDocument();
    expect(screen.getByText('Propiedad eliminada')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
