import { vi, describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { BuyButton } from '../BuyButton';
import * as blockchain from '@/lib/blockchain';
import * as api from '@/lib/api';

vi.mock('@/lib/blockchain');
vi.mock('@/lib/api');

afterEach(() => {
  sessionStorage.clear();
});

describe('BuyButton', () => {
  it('deposita on-chain y registra el depósito en el backend', async () => {
    sessionStorage.setItem('rynok_token', 'fake-token');
    sessionStorage.setItem('rynok_address', '0xbuyer');

    vi.mocked(blockchain.depositEscrow).mockResolvedValue('0xhash');
    vi.mocked(api.recordEscrowDeposit).mockResolvedValue({} as any);
    vi.mocked(api.getMe).mockResolvedValue({
      id: '1',
      walletAddress: '0xbuyer',
    } as any);

    render(
      <WalletProvider>
        <BuyButton propertyId="prop-1" sellerWallet="0xdef" priceEth="2" />
      </WalletProvider>,
    );

    fireEvent.click(screen.getByText('Comprar con MetaMask'));

    await waitFor(() => {
      expect(screen.getByText('Fondos en escrow')).toBeInTheDocument();
    });
  });
});