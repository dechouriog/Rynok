import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { verifyMessage } from 'ethers';
import { useState } from 'react';
import * as api from '@/lib/api';
import { useWallet } from './WalletContext';
import { installFakeEthereum, renderWithProviders, startSession, fakeJwt, BUYER } from '@/test/utils';

vi.mock('@/lib/api', async (original) => ({
  ...(await original<typeof import('@/lib/api')>()),
  connectWallet: vi.fn(),
  requestLoginMessage: vi.fn(),
  getMe: vi.fn(),
}));

function Probe() {
  const wallet = useWallet();
  const [result, setResult] = useState('');
  return (
    <div>
      <span data-testid="address">{wallet.address ?? 'sin conectar'}</span>
      <span data-testid="wrong">{String(wallet.isWrongNetwork)}</span>
      <span data-testid="provider">{String(wallet.hasProvider)}</span>
      <span data-testid="error">{wallet.error ?? ''}</span>
      <span data-testid="result">{result}</span>
      <button onClick={() => void wallet.connect()}>conectar</button>
      <button onClick={wallet.disconnect}>desconectar</button>
      <button onClick={() => void wallet.switchNetwork()}>cambiar red</button>
      <button
        onClick={() =>
          wallet
            .withSession(async (token) => {
              if (token === 'viejo') throw new api.ApiError(401, 'expirado');
              return `ok:${token === 'viejo' ? 'viejo' : 'nuevo'}`;
            })
            .then(setResult, (e: Error) => setResult(`error:${e.message}`))
        }
      >
        operar
      </button>
    </div>
  );
}

describe('WalletContext', () => {
  beforeEach(() => {
    vi.mocked(api.getMe).mockResolvedValue({ id: 'u1', walletAddress: BUYER });
    // El servidor emite un mensaje de un solo uso con nonce (POST /auth/nonce).
    vi.mocked(api.requestLoginMessage).mockImplementation(
      async (wallet) => `Iniciar sesión en Rynok

Wallet: ${wallet.toLowerCase()}
Nonce: 9f86d081
Emitido: 2026-11-17T12:00:00.000Z`,
    );
  });

  it('sin MetaMask muestra un error claro al conectar', async () => {
    renderWithProviders(<Probe />);
    expect(screen.getByTestId('provider')).toHaveTextContent('false');
    await userEvent.click(screen.getByText('conectar'));
    expect(screen.getByTestId('error')).toHaveTextContent(/MetaMask no está instalado/);
  });

  it('conecta firmando el mensaje de Rynok con la wallet real', async () => {
    const { wallet } = installFakeEthereum();
    vi.mocked(api.connectWallet).mockResolvedValue({
      accessToken: fakeJwt(),
      user: { id: 'u1', walletAddress: wallet.address },
    });
    renderWithProviders(<Probe />);

    await userEvent.click(screen.getByText('conectar'));
    await waitFor(() => expect(screen.getByTestId('address')).toHaveTextContent(wallet.address.toLowerCase()));

    const [address, signature, message] = vi.mocked(api.connectWallet).mock.calls[0];
    expect(address).toBe(wallet.address);
    expect(message).toContain(`Wallet: ${wallet.address.toLowerCase()}`);
    expect(api.requestLoginMessage).toHaveBeenCalledWith(wallet.address);
    expect(verifyMessage(message, signature)).toBe(wallet.address);
    expect(screen.getByTestId('wrong')).toHaveTextContent('false');
  });

  it('informa si la persona rechaza la firma', async () => {
    installFakeEthereum({ rejectSign: true });
    renderWithProviders(<Probe />);
    await userEvent.click(screen.getByText('conectar'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('Cancelaste la conexión en MetaMask.'));
  });

  it('muestra el mensaje del backend si rechaza el login', async () => {
    installFakeEthereum();
    vi.mocked(api.connectWallet).mockRejectedValue(new api.ApiError(401, 'El mensaje de inicio de sesión expiró.'));
    renderWithProviders(<Probe />);
    await userEvent.click(screen.getByText('conectar'));
    await waitFor(() => expect(screen.getByTestId('error')).toHaveTextContent('expiró'));
  });

  it('detecta la red equivocada y permite cambiarla', async () => {
    installFakeEthereum({ chainId: 1 });
    startSession(BUYER);
    renderWithProviders(<Probe />);
    await waitFor(() => expect(screen.getByTestId('wrong')).toHaveTextContent('true'));
    await userEvent.click(screen.getByText('cambiar red'));
    await waitFor(() => expect(screen.getByTestId('wrong')).toHaveTextContent('false'));
  });

  it('cierra la sesión si cambias de cuenta en MetaMask', async () => {
    const fake = installFakeEthereum();
    startSession(BUYER);
    renderWithProviders(<Probe />);
    expect(screen.getByTestId('address')).toHaveTextContent(BUYER);
    act(() => fake.emit('accountsChanged', ['0x0000000000000000000000000000000000000001']));
    await waitFor(() => expect(screen.getByTestId('address')).toHaveTextContent('sin conectar'));
    expect(await screen.findByText('Cambiaste de cuenta en MetaMask')).toBeInTheDocument();
  });

  it('cierra en silencio una sesión cuyo token rechaza el backend', async () => {
    installFakeEthereum();
    startSession(BUYER);
    vi.mocked(api.getMe).mockRejectedValue(new api.ApiError(401, 'Sesión inválida'));
    renderWithProviders(<Probe />);
    await waitFor(() => expect(screen.getByTestId('address')).toHaveTextContent('sin conectar'));
  });

  it('withSession reconecta automáticamente cuando el JWT expiró (401) y reintenta', async () => {
    const { wallet } = installFakeEthereum();
    startSession(wallet.address, 'viejo');
    vi.mocked(api.connectWallet).mockResolvedValue({
      accessToken: fakeJwt(),
      user: { id: 'u1', walletAddress: wallet.address },
    });
    renderWithProviders(<Probe />);

    await userEvent.click(screen.getByText('operar'));
    await waitFor(() => expect(screen.getByTestId('result')).toHaveTextContent('ok:nuevo'));
    expect(api.connectWallet).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Tu sesión expiró')).toBeInTheDocument();
  });

  it('withSession sin wallet ni MetaMask falla con 401 explicativo', async () => {
    renderWithProviders(<Probe />);
    await userEvent.click(screen.getByText('operar'));
    await waitFor(() =>
      expect(screen.getByTestId('result')).toHaveTextContent('error:Conecta tu wallet para continuar.'),
    );
  });

  it('desconectar borra la sesión', async () => {
    installFakeEthereum();
    startSession(BUYER);
    renderWithProviders(<Probe />);
    await userEvent.click(screen.getByText('desconectar'));
    expect(screen.getByTestId('address')).toHaveTextContent('sin conectar');
    expect(window.sessionStorage.getItem('rynok_session')).toBeNull();
  });

  it('useWallet fuera del provider lanza un error claro', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() => renderWithProviders(<></>) && useWallet()).toThrow();
    spy.mockRestore();
  });
});
