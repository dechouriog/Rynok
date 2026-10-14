import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { PropertyOwnerActions } from '../PropertyOwnerActions';
import * as blockchain from '@/lib/blockchain';
import * as api from '@/lib/api';

vi.mock('@/lib/blockchain');
vi.mock('@/lib/api');
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const property: api.Property = {
  id: 'prop-1',
  title: 'Casa',
  description: 'x',
  location: 'Medellín',
  priceEth: '2',
  status: 'AVAILABLE',
  owner: { id: 'owner-1', walletAddress: '0xdef' },
  createdAt: '',
};

function renderAsOwner(p: api.Property = property) {
  sessionStorage.setItem('rynok_token', 'fake-token');
  sessionStorage.setItem('rynok_address', '0xdef');
  vi.mocked(api.getMe).mockResolvedValue({ id: 'owner-1', walletAddress: '0xdef' } as any);
  return render(
    <WalletProvider>
      <PropertyOwnerActions property={p} />
    </WalletProvider>,
  );
}

beforeEach(() => {
  vi.resetAllMocks();
});

afterEach(() => {
  sessionStorage.clear();
});

describe('PropertyOwnerActions — habilitar compra', () => {
  it('el dueño habilita la compra firmando list(propertyId, price)', async () => {
    vi.mocked(blockchain.getListingState).mockResolvedValue({ status: 'not-listed' });
    vi.mocked(blockchain.listOnChain).mockResolvedValue('0xlist');

    renderAsOwner();

    fireEvent.click(await screen.findByText('Habilitar compra'));

    expect(await screen.findByText('Compra habilitada on-chain.')).toBeInTheDocument();
    expect(blockchain.listOnChain).toHaveBeenCalledWith('prop-1', '2');
  });

  it('pide actualizar el precio si no coincide con el publicado', async () => {
    vi.mocked(blockchain.getListingState).mockResolvedValue({ status: 'price-mismatch' });

    renderAsOwner();

    expect(await screen.findByText('Actualizar precio on-chain')).toBeInTheDocument();
  });

  it('no ofrece habilitar la compra si ya está habilitada', async () => {
    vi.mocked(blockchain.getListingState).mockResolvedValue({ status: 'listed' });

    renderAsOwner();

    expect(await screen.findByText('Compra habilitada on-chain.')).toBeInTheDocument();
    expect(screen.queryByText('Habilitar compra')).not.toBeInTheDocument();
  });

  it('no ofrece habilitar la compra de una propiedad en escrow', async () => {
    renderAsOwner({ ...property, status: 'IN_ESCROW' });

    expect(await screen.findByText('Editar')).toBeInTheDocument();
    expect(screen.queryByText('Habilitar compra')).not.toBeInTheDocument();
    expect(blockchain.getListingState).not.toHaveBeenCalled();
  });
});
