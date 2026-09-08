import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PropertiesPage from '../page';
import * as api from '@/lib/api';

vi.mock('@/lib/api');
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

describe('PropertiesPage (integración)', () => {
  it('renderiza las propiedades filtradas devueltas por la API', async () => {
    vi.mocked(api.getProperties).mockResolvedValue([
      { id: '1', title: 'Casa A', description: '', location: 'Medellín', priceEth: '1',
        owner: { id: 'o1', walletAddress: '0x1' }, createdAt: '' },
    ]);

    const ui = await PropertiesPage({ searchParams: Promise.resolve({ location: 'Medellín' }) });
    render(ui as any);

    expect(api.getProperties).toHaveBeenCalledWith({ location: 'Medellín' });
    expect(screen.getByText('Casa A')).toBeInTheDocument();
  });

  it('muestra mensaje cuando no hay resultados', async () => {
    vi.mocked(api.getProperties).mockResolvedValue([]);
    const ui = await PropertiesPage({ searchParams: Promise.resolve({}) });
    render(ui as any);
    expect(screen.getByText(/no se encontraron propiedades/i)).toBeInTheDocument();
  });
});
