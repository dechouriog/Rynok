import { render, screen } from '@testing-library/react';
import { PropertyCard } from '../PropertyCard';

const property = {
  id: '1', title: 'Casa de prueba', description: 'd', location: 'Medellín',
  priceEth: '3.500000', owner: { id: 'o1', walletAddress: '0xabc' }, createdAt: new Date().toISOString(),
};

describe('PropertyCard', () => {
  it('muestra título, ubicación y precio sin ceros de relleno', () => {
    render(<PropertyCard property={property} />);
    expect(screen.getByText('Casa de prueba')).toBeInTheDocument();
    expect(screen.getByText('Medellín')).toBeInTheDocument();
    expect(screen.getByText('3.5 ETH')).toBeInTheDocument();
  });

  it('indica cuando la propiedad está vendida', () => {
    render(<PropertyCard property={{ ...property, status: 'SOLD' }} />);
    expect(screen.getByText('Vendida')).toBeInTheDocument();
  });

  it('no muestra indicador si está disponible', () => {
    render(<PropertyCard property={{ ...property, status: 'AVAILABLE' }} />);
    expect(screen.queryByText('Vendida')).not.toBeInTheDocument();
    expect(screen.queryByText('En escrow')).not.toBeInTheDocument();
  });
});
