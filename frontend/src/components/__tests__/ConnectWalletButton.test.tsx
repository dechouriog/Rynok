import { render, screen } from '@testing-library/react';
import { WalletProvider } from '@/context/WalletContext';
import { ConnectWalletButton } from '../ConnectWalletButton';

describe('ConnectWalletButton', () => {
  it('muestra "Conectar wallet" cuando no hay dirección', () => {
    render(<WalletProvider><ConnectWalletButton /></WalletProvider>);
    expect(screen.getByText('Conectar wallet')).toBeInTheDocument();
  });
});