import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyFilters } from '../PropertyFilters';

const push = vi.fn();
let params = new URLSearchParams();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => params,
}));

beforeEach(() => {
  push.mockReset();
  params = new URLSearchParams();
});

const priceSelect = () => screen.getByLabelText('Rango de precio') as HTMLSelectElement;
const sortSelect = () => screen.getByLabelText('Ordenar') as HTMLSelectElement;

describe('PropertyFilters', () => {
  it('sin filtros muestra "Cualquier precio" y "Más recientes"', () => {
    render(<PropertyFilters />);
    expect(priceSelect().selectedOptions[0].textContent).toBe('Cualquier precio');
    expect(sortSelect().selectedOptions[0].textContent).toBe('Más recientes');
  });

  it('refleja el rango y el orden que vienen en la URL', () => {
    params = new URLSearchParams('minPrice=2&maxPrice=5&sort=price_desc&q=casa&location=Medellín');
    render(<PropertyFilters />);

    expect(priceSelect().selectedOptions[0].textContent).toBe('2 - 5 ETH');
    expect(sortSelect().selectedOptions[0].textContent).toBe('Precio: mayor a menor');
    expect(screen.getByPlaceholderText('Buscar por título')).toHaveValue('casa');
    expect(screen.getByPlaceholderText('Ubicación')).toHaveValue('Medellín');
  });

  it('refleja rangos abiertos ("Hasta 2 ETH" y "5+ ETH")', () => {
    params = new URLSearchParams('maxPrice=2');
    const { unmount } = render(<PropertyFilters />);
    expect(priceSelect().selectedOptions[0].textContent).toBe('Hasta 2 ETH');
    unmount();

    params = new URLSearchParams('minPrice=5');
    render(<PropertyFilters />);
    expect(priceSelect().selectedOptions[0].textContent).toBe('5+ ETH');
  });

  it('un rango que no está en la lista vuelve a "Cualquier precio"', () => {
    params = new URLSearchParams('minPrice=3&maxPrice=4');
    render(<PropertyFilters />);
    expect(priceSelect().selectedOptions[0].textContent).toBe('Cualquier precio');
  });

  it('al elegir un rango actualiza la URL conservando los demás filtros', () => {
    params = new URLSearchParams('location=Medellín&minPrice=5');
    render(<PropertyFilters />);

    fireEvent.change(priceSelect(), { target: { value: '1' } }); // Hasta 2 ETH

    expect(push).toHaveBeenCalledWith('/properties?location=Medell%C3%ADn&maxPrice=2');
  });

  it('al cambiar el orden actualiza la URL', () => {
    render(<PropertyFilters />);
    fireEvent.change(sortSelect(), { target: { value: 'price_asc' } });
    expect(push).toHaveBeenCalledWith('/properties?sort=price_asc');
  });

  it('la búsqueda envía título y ubicación, y omite los vacíos', () => {
    render(<PropertyFilters />);
    fireEvent.change(screen.getByPlaceholderText('Buscar por título'), { target: { value: 'loft' } });
    fireEvent.click(screen.getByText('Buscar'));
    expect(push).toHaveBeenCalledWith('/properties?q=loft');
  });
});
