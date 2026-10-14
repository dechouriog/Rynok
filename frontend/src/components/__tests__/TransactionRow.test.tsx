import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TransactionRow } from '../TransactionRow';
import * as blockchain from '@/lib/blockchain';
import * as api from '@/lib/api';

vi.mock('@/lib/blockchain');
vi.mock('@/lib/api');

const tx = {
  id: '1', propertyId: 'p1', buyerWallet: '0xAAA', sellerWallet: '0xBBB',
  amountEth: '2.5', status: 'AWAITING_DELIVERY' as const, depositTxHash: '0xhash', createdAt: '',
};

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('TransactionRow', () => {
  it('muestra "Compra" cuando el usuario es el comprador', () => {
    render(<TransactionRow tx={tx} myWallet="0xAAA" />);
    expect(screen.getByText('Compra')).toBeInTheDocument();
    expect(screen.getByText('Fondos retenidos')).toBeInTheDocument();
  });

  it('muestra "Venta" cuando el usuario es el vendedor', () => {
    render(<TransactionRow tx={tx} myWallet="0xBBB" />);
    expect(screen.getByText('Venta')).toBeInTheDocument();
  });

  it('sin token no muestra acciones', () => {
    render(<TransactionRow tx={tx} myWallet="0xAAA" />);
    expect(screen.queryByText('Confirmar entrega')).not.toBeInTheDocument();
  });

  it('el comprador confirma la entrega on-chain y luego en el backend', async () => {
    const onUpdated = vi.fn();
    vi.mocked(blockchain.confirmDeliveryOnChain).mockResolvedValue('0xrelease');
    vi.mocked(api.confirmEscrowRelease).mockResolvedValue({ ...tx, status: 'COMPLETE' });

    render(<TransactionRow tx={tx} myWallet="0xaaa" token="t" onUpdated={onUpdated} />);
    fireEvent.click(screen.getByText('Confirmar entrega'));

    await waitFor(() => expect(onUpdated).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMPLETE' })));
    expect(api.confirmEscrowRelease).toHaveBeenCalledWith('p1', '0xrelease', 't');
  });

  it('el vendedor puede reembolsar', async () => {
    vi.mocked(blockchain.refundOnChain).mockResolvedValue('0xrefund');
    vi.mocked(api.refundEscrow).mockResolvedValue({ ...tx, status: 'REFUNDED' });

    render(<TransactionRow tx={tx} myWallet="0xBBB" token="t" />);
    fireEvent.click(screen.getByText('Reembolsar al comprador'));

    await waitFor(() => expect(api.refundEscrow).toHaveBeenCalledWith('p1', '0xrefund', 't'));
  });

  it('las llamadas on-chain identifican el depósito por propiedad y vendedor', async () => {
    vi.mocked(blockchain.confirmDeliveryOnChain).mockResolvedValue('0xrelease');
    vi.mocked(api.confirmEscrowRelease).mockResolvedValue({ ...tx, status: 'COMPLETE' });

    render(<TransactionRow tx={tx} myWallet="0xAAA" token="t" />);
    fireEvent.click(screen.getByText('Confirmar entrega'));

    await waitFor(() => expect(blockchain.confirmDeliveryOnChain).toHaveBeenCalledWith('p1', '0xBBB'));
  });

  it('el comprador no ve "Reclamar reembolso" antes de 30 días', () => {
    render(<TransactionRow tx={{ ...tx, createdAt: new Date().toISOString() }} myWallet="0xAAA" token="t" />);
    expect(screen.queryByText('Reclamar reembolso')).not.toBeInTheDocument();
  });

  it('vencido el plazo, el comprador reclama el reembolso', async () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    vi.mocked(blockchain.claimRefundOnChain).mockResolvedValue('0xclaim');
    vi.mocked(api.refundEscrow).mockResolvedValue({ ...tx, status: 'REFUNDED' });

    render(<TransactionRow tx={{ ...tx, createdAt: old }} myWallet="0xAAA" token="t" />);
    fireEvent.click(screen.getByText('Reclamar reembolso'));

    await waitFor(() => expect(api.refundEscrow).toHaveBeenCalledWith('p1', '0xclaim', 't'));
    expect(blockchain.claimRefundOnChain).toHaveBeenCalledWith('p1', '0xBBB');
  });

  it('el vendedor no ve "Reclamar reembolso"', () => {
    const old = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000).toISOString();
    render(<TransactionRow tx={{ ...tx, createdAt: old }} myWallet="0xBBB" token="t" />);
    expect(screen.queryByText('Reclamar reembolso')).not.toBeInTheDocument();
  });

  it('muestra el error si la transacción falla', async () => {
    vi.mocked(blockchain.confirmDeliveryOnChain).mockRejectedValue(new Error('user rejected'));

    render(<TransactionRow tx={tx} myWallet="0xAAA" token="t" />);
    fireEvent.click(screen.getByText('Confirmar entrega'));

    expect(await screen.findByText('user rejected')).toBeInTheDocument();
    expect(api.confirmEscrowRelease).not.toHaveBeenCalled();
  });
});
