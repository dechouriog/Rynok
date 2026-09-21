import { vi, describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { BuyButton } from '../BuyButton';
import * as blockchain from '@/lib/blockchain';
import * as api from '@/lib/api';

vi.mock('@/lib/blockchain');
vi.mock('@/lib/api');

describe('BuyButton', () => {
  it('deposita on-chain y registra el depósito en el backend', async () => {
    vi.mocked(blockchain.depositEscrow).mockResolvedValue('0xhash');
    vi.mocked(api.recordEscrowDeposit).mockResolvedValue({} as any);

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