import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletProvider, useWallet } from '../WalletContext';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

function TestComponent() {
  const { address, connect } = useWallet();
  return (
    <div>
      <span data-testid="address">{address ?? 'sin conectar'}</span>
      <button onClick={connect}>Conectar</button>
    </div>
  );
}

describe('WalletContext', () => {
  beforeEach(() => {
    (window as any).ethereum = { request: jest.fn() };
  });

  it('muestra "sin conectar" antes de conectar', () => {
    render(<WalletProvider><TestComponent /></WalletProvider>);
    expect(screen.getByTestId('address')).toHaveTextContent('sin conectar');
  });
});