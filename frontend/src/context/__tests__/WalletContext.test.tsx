import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WalletProvider, useWallet } from '../WalletContext';

vi.mock('@/lib/api');

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
    (window as any).ethereum = { request: vi.fn() };
  });

  it('muestra "sin conectar" antes de conectar', () => {
    render(<WalletProvider><TestComponent /></WalletProvider>);
    expect(screen.getByTestId('address')).toHaveTextContent('sin conectar');
  });
});
