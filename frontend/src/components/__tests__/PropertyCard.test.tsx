import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';

const property = {
  id: '1', title: 'Casa de prueba', description: 'd', location: 'Medellín',
  priceEth: '3.0', owner: { id: 'o1', walletAddress: '0xabc' }, createdAt: new Date().toISOString(),
};

describe('PropertyCard', () => {
  it('muestra título, ubicación y precio', () => {
    render(<PropertyCard property={property} />);
    expect(screen.getByText('Casa de prueba')).toBeInTheDocument();
    expect(screen.getByText('Medellín')).toBeInTheDocument();
    expect(screen.getByText('3.0 ETH')).toBeInTheDocument();
  });
});