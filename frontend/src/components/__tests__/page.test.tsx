import { render, screen } from '@testing-library/react';
import PropertiesPage from '../page';
import * as api from '@/lib/api';

jest.mock('@/lib/api');

describe('PropertiesPage (integración)', () => {
  it('renderiza las propiedades filtradas devueltas por la API', async () => {
    (api.getProperties as jest.Mock).mockResolvedValue([
      { id: '1', title: 'Casa A', description: '', location: 'Medellín', priceEth: '1',
        owner: { id: 'o1', walletAddress: '0x1' }, createdAt: '' },
    ]);

    const ui = await PropertiesPage({ searchParams: { location: 'Medellín' } });
    render(ui as any);

    expect(api.getProperties).toHaveBeenCalledWith({ location: 'Medellín' });
    expect(screen.getByText('Casa A')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay resultados', async () => {
    (api.getProperties as jest.Mock).mockResolvedValue([]);
    const ui = await PropertiesPage({ searchParams: {} });
    render(ui as any);
    expect(screen.getByText(/no se encontraron propiedades/i)).toBeInTheDocument();
  });
});