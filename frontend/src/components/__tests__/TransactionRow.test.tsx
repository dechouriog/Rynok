import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionRow } from '../TransactionRow';

const tx = {
  id: '1', propertyId: 'p1', buyerWallet: '0xAAA', sellerWallet: '0xBBB',
  amountEth: '2.5', status: 'AWAITING_DELIVERY' as const, depositTxHash: '0xhash', createdAt: '',
};

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
});