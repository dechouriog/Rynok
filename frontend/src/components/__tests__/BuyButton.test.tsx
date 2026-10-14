import { vi, describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { BuyButton } from '../BuyButton';
import * as blockchain from '@/lib/blockchain';
import * as api from '@/lib/api';

vi.mock('@/lib/blockchain');
vi.mock('@/lib/api');

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(blockchain.getListingState).mockResolvedValue({ status: 'listed' });
});

afterEach(() => {
  sessionStorage.clear();
});

function renderButton(props: Partial<Parameters<typeof BuyButton>[0]> = {}) {
  return render(
    <WalletProvider>
      <BuyButton propertyId="prop-1" sellerWallet="0xdef" priceEth="2" {...props} />
    </WalletProvider>,
  );
}

function loginAs(wallet: string) {
  sessionStorage.setItem('rynok_token', 'fake-token');
  sessionStorage.setItem('rynok_address', wallet);
  vi.mocked(api.getMe).mockResolvedValue({ id: '1', walletAddress: wallet.toLowerCase() } as any);
}

describe('BuyButton', () => {
  it('deposita on-chain y registra el depósito en el backend', async () => {
    loginAs('0xbuyer');
    vi.mocked(blockchain.depositEscrow).mockResolvedValue('0xhash');
    vi.mocked(api.recordEscrowDeposit).mockResolvedValue({} as any);

    renderButton();

    fireEvent.click(await screen.findByText('Comprar con MetaMask'));

    await waitFor(() => {
      expect(screen.getByText('Fondos en escrow')).toBeInTheDocument();
    });
    expect(blockchain.getListingState).toHaveBeenCalledWith('prop-1', '0xdef', '2');
  });

  it('no aparece si el vendedor no habilitó la compra on-chain', async () => {
    vi.mocked(blockchain.getListingState).mockResolvedValue({ status: 'not-listed' });

    renderButton();

    expect(await screen.findByText('El vendedor aún no habilitó la compra on-chain.')).toBeInTheDocument();
    expect(screen.queryByText('Comprar con MetaMask')).not.toBeInTheDocument();
  });

  it('no aparece si el precio on-chain no coincide con el publicado', async () => {
    vi.mocked(blockchain.getListingState).mockResolvedValue({ status: 'price-mismatch' });

    renderButton();

    expect(await screen.findByText('El vendedor aún no habilitó la compra on-chain.')).toBeInTheDocument();
    expect(screen.queryByText('Comprar con MetaMask')).not.toBeInTheDocument();
  });

  it('explica por qué no se pudo verificar el contrato', async () => {
    vi.mocked(blockchain.getListingState).mockResolvedValue({ status: 'unavailable', reason: 'MetaMask no está instalado.' });

    renderButton();

    expect(await screen.findByText('MetaMask no está instalado.')).toBeInTheDocument();
  });

  it('no permite comprar una propiedad vendida', () => {
    renderButton({ status: 'SOLD' });

    expect(screen.queryByText('Comprar con MetaMask')).not.toBeInTheDocument();
    expect(screen.getByText('Esta propiedad ya fue vendida')).toBeInTheDocument();
  });

  it('no muestra el botón al dueño de la propiedad', async () => {
    loginAs('0xDEF');

    renderButton();

    await waitFor(() => {
      expect(screen.queryByText('Comprar con MetaMask')).not.toBeInTheDocument();
    });
  });

  it('muestra el motivo cuando el depósito falla', async () => {
    loginAs('0xbuyer');
    vi.mocked(blockchain.depositEscrow).mockRejectedValue(new Error('El monto debe ser igual al precio'));

    renderButton();

    fireEvent.click(await screen.findByText('Comprar con MetaMask'));
    expect(await screen.findByText('El monto debe ser igual al precio')).toBeInTheDocument();
  });
});
