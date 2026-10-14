import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletProvider, useWallet } from '../WalletContext';
import * as api from '@/lib/api';

vi.mock('@/lib/api');

const signMessage = vi.fn();
vi.mock('ethers', () => ({
  BrowserProvider: class {
    send = vi.fn().mockResolvedValue(['0xabc']);
    getSigner = vi.fn().mockResolvedValue({ signMessage });
  },
}));

function TestComponent() {
  const { address, connect, error } = useWallet();
  return (
    <div>
      <span data-testid="address">{address ?? 'sin conectar'}</span>
      <span data-testid="error">{error ?? ''}</span>
      <button onClick={connect}>Conectar</button>
    </div>
  );
}

describe('WalletContext', () => {
  let listeners: Record<string, (accounts: string[]) => void>;

  beforeEach(() => {
    vi.resetAllMocks();
    listeners = {};
    (window as any).ethereum = {
      request: vi.fn().mockResolvedValue([]),
      on: (event: string, fn: (accounts: string[]) => void) => { listeners[event] = fn; },
      removeListener: vi.fn(),
    };
    vi.mocked(api.getMe).mockResolvedValue({ id: '1', walletAddress: '0xabc' } as any);
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('muestra "sin conectar" antes de conectar', () => {
    render(<WalletProvider><TestComponent /></WalletProvider>);
    expect(screen.getByTestId('address')).toHaveTextContent('sin conectar');
  });

  it('firma el mensaje con nonce que entrega el backend', async () => {
    vi.mocked(api.requestLoginMessage).mockResolvedValue('Iniciar sesión en Rynok\nNonce: abc');
    vi.mocked(api.connectWallet).mockResolvedValue({ accessToken: 'jwt', user: { id: '1', walletAddress: '0xabc' } });
    signMessage.mockResolvedValue('0xfirma');

    render(<WalletProvider><TestComponent /></WalletProvider>);
    fireEvent.click(screen.getByText('Conectar'));

    await waitFor(() => expect(screen.getByTestId('address')).toHaveTextContent('0xabc'));
    expect(api.requestLoginMessage).toHaveBeenCalledWith('0xabc');
    expect(signMessage).toHaveBeenCalledWith('Iniciar sesión en Rynok\nNonce: abc');
    expect(api.connectWallet).toHaveBeenCalledWith('0xabc', '0xfirma', 'Iniciar sesión en Rynok\nNonce: abc');
  });

  it('cierra la sesión si MetaMask cambia a otra cuenta', async () => {
    sessionStorage.setItem('rynok_token', 'jwt');
    sessionStorage.setItem('rynok_address', '0xabc');

    render(<WalletProvider><TestComponent /></WalletProvider>);
    await waitFor(() => expect(screen.getByTestId('address')).toHaveTextContent('0xabc'));

    listeners.accountsChanged(['0xotra']);

    await waitFor(() => expect(screen.getByTestId('address')).toHaveTextContent('sin conectar'));
    expect(sessionStorage.getItem('rynok_token')).toBeNull();
  });
});
