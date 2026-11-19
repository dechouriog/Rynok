import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import * as api from '@/lib/api';
import PropertiesPage from './properties/page';
import PropertyDetailPage, { generateMetadata } from './properties/[id]/page';
import EditPropertyPage from './properties/[id]/edit/page';
import NewPropertyPage from './properties/new/page';
import HomePage from './page';
import AboutPage from './about/page';
import NotFound from './not-found';
import ErrorPage from './error';
import EscrowPage from './escrow/page';
import DashboardPage from './dashboard/page';
import WalletPage from './wallet/page';
import PropertiesLoading from './properties/loading';
import DetailLoading from './properties/[id]/loading';
import { RecentProperties } from '@/components/RecentProperties';
import {
  installFakeEthereum,
  makeProperty,
  makeTransaction,
  renderWithProviders,
  startSession,
  BUYER,
  SELLER,
} from '@/test/utils';

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND');
});
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/dashboard',
  notFound: () => notFound(),
}));

vi.mock('@/lib/blockchain', async (original) => ({
  ...(await original<typeof import('@/lib/blockchain')>()),
  getListingState: vi.fn().mockResolvedValue({ status: 'not-listed' }),
}));

vi.mock('@/lib/api', async (original) => ({
  ...(await original<typeof import('@/lib/api')>()),
  getProperties: vi.fn(),
  getProperty: vi.fn(),
  getMe: vi.fn().mockResolvedValue({ id: 'u', walletAddress: '0x' }),
  getMyProperties: vi.fn(),
  getMyTransactions: vi.fn(),
}));

const page = (items: api.Property[], extra: Partial<api.Page<api.Property>> = {}) => ({
  items,
  total: items.length,
  page: 1,
  limit: 9,
  totalPages: 1,
  ...extra,
});

describe('Marketplace /properties', () => {
  it('pide a la API los filtros saneados y muestra resultados y paginación', async () => {
    vi.mocked(api.getProperties).mockResolvedValue(
      page([makeProperty({ title: 'Casa A' })], { total: 20, totalPages: 3 }),
    );
    const ui = await PropertiesPage({
      searchParams: Promise.resolve({ location: 'Medellín', sort: 'precio', page: '1' }),
    });
    render(ui);
    expect(api.getProperties).toHaveBeenCalledWith(
      expect.objectContaining({ location: 'Medellín', sort: undefined, page: 1, limit: 9 }),
    );
    expect(screen.getByText('Casa A')).toBeInTheDocument();
    expect(screen.getByText(/20 propiedades · página 1 de 3/)).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument();
  });

  it('distingue “sin resultados con filtros” de “marketplace vacío”', async () => {
    vi.mocked(api.getProperties).mockResolvedValue(page([]));
    render(await PropertiesPage({ searchParams: Promise.resolve({ q: 'castillo' }) }));
    expect(screen.getByText('No hay propiedades con esos filtros')).toBeInTheDocument();
    render(await PropertiesPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByText('Aún no hay propiedades publicadas')).toBeInTheDocument();
  });
});

describe('Detalle /properties/[id]', () => {
  it('renderiza la propiedad y su metadata', async () => {
    vi.mocked(api.getProperty).mockResolvedValue(makeProperty({ imageUrl: 'https://img.test/a.jpg' }));
    renderWithProviders((await PropertyDetailPage({ params: Promise.resolve({ id: 'p1' }) })) as ReactElement);
    expect(screen.getByRole('heading', { level: 1, name: 'Apartamento en El Poblado' })).toBeInTheDocument();
    expect(screen.getByText('Compra protegida por escrow')).toBeInTheDocument();
    const metadata = await generateMetadata({ params: Promise.resolve({ id: 'p1' }) });
    expect(metadata.title).toBe('Apartamento en El Poblado');
  });

  it('llama a notFound() si la propiedad no existe', async () => {
    vi.mocked(api.getProperty).mockResolvedValue(null);
    await expect(PropertyDetailPage({ params: Promise.resolve({ id: 'x' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    await expect(EditPropertyPage({ params: Promise.resolve({ id: 'x' }) })).rejects.toThrow('NEXT_NOT_FOUND');
    expect((await generateMetadata({ params: Promise.resolve({ id: 'x' }) })).title).toBe('Propiedad no encontrada');
  });
});

describe('Editar', () => {
  async function renderEdit(property: api.Property) {
    vi.mocked(api.getProperty).mockResolvedValue(property);
    renderWithProviders((await EditPropertyPage({ params: Promise.resolve({ id: property.id }) })) as ReactElement);
  }

  beforeEach(() => installFakeEthereum());

  it('el dueño ve el formulario y el aviso de precio', async () => {
    startSession(SELLER);
    await renderEdit(makeProperty());
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument();
    expect(screen.getByText(/Actualizar precio on-chain/)).toBeInTheDocument();
  });

  it('otra wallet no puede editar', async () => {
    startSession(BUYER);
    await renderEdit(makeProperty());
    expect(screen.getByText('No puedes editar esta propiedad')).toBeInTheDocument();
  });

  it('una propiedad reservada no se edita', async () => {
    startSession(SELLER);
    await renderEdit(makeProperty({ status: 'IN_ESCROW' }));
    expect(screen.getByText('Esta propiedad ya no se puede editar')).toBeInTheDocument();
  });
});

describe('Cuenta', () => {
  beforeEach(() => installFakeEthereum());

  it('sin sesión, las páginas de cuenta piden conectar la wallet', () => {
    renderWithProviders(
      <>
        <DashboardPage />
        <EscrowPage />
        <WalletPage />
        <NewPropertyPage />
      </>,
    );
    expect(screen.getAllByRole('button', { name: 'Conectar wallet' })).toHaveLength(4);
  });

  it('/escrow separa compras y ventas', async () => {
    startSession(BUYER);
    vi.mocked(api.getMyTransactions).mockResolvedValue([
      makeTransaction({ id: 'compra' }),
      makeTransaction({ id: 'venta', buyerWallet: SELLER, sellerWallet: BUYER }),
    ]);
    renderWithProviders(<EscrowPage />);
    expect(await screen.findByRole('tab', { name: /Mis compras/ })).toHaveTextContent('1');
    expect(screen.getByRole('button', { name: 'Confirmar entrega' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /Mis ventas/ }));
    expect(screen.getByRole('button', { name: 'Reembolsar al comprador' })).toBeInTheDocument();
  });

  it('/escrow vacío ofrece explorar, y con error permite reintentar', async () => {
    startSession(BUYER);
    vi.mocked(api.getMyTransactions)
      .mockRejectedValueOnce(new api.ApiError(0, api.NETWORK_ERROR_MESSAGE))
      .mockResolvedValueOnce([]);
    renderWithProviders(<EscrowPage />);
    expect(await screen.findByText('No pudimos cargar tus operaciones')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Aún no has comprado propiedades')).toBeInTheDocument();
  });

  it('/dashboard muestra estadísticas, propiedades y compras pendientes', async () => {
    startSession(BUYER);
    vi.mocked(api.getMyProperties).mockResolvedValue([
      makeProperty({ id: 'a', title: 'Casa A' }),
      makeProperty({ id: 'b', title: 'Casa B', status: 'SOLD' }),
    ]);
    vi.mocked(api.getMyTransactions).mockResolvedValue([makeTransaction()]);
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('Casa A')).toBeInTheDocument();
    expect(screen.getByText(/Tienes 1 compra con fondos en escrow/)).toBeInTheDocument();
    expect(screen.getByText('Vendidas').parentElement).toHaveTextContent('1');
  });

  it('/dashboard vacío invita a publicar y muestra errores', async () => {
    startSession(BUYER);
    vi.mocked(api.getMyProperties).mockResolvedValueOnce([]).mockRejectedValueOnce(new api.ApiError(500, 'falló'));
    vi.mocked(api.getMyTransactions).mockResolvedValue([]);
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText('Aún no publicas propiedades')).toBeInTheDocument();
  });

  it('/wallet muestra dirección, red y permite cerrar sesión con confirmación', async () => {
    startSession(BUYER);
    renderWithProviders(<WalletPage />);
    expect(screen.getByText(BUYER)).toBeInTheDocument();
    expect(await screen.findByText('Hardhat local')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }));
    await userEvent.click(screen.getAllByRole('button', { name: 'Cerrar sesión' }).at(-1)!);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Conectar wallet' })).toBeInTheDocument());
  });
});

describe('Portada y páginas informativas', () => {
  it('la home muestra recientes y sobrevive a un backend caído', async () => {
    vi.mocked(api.getProperties).mockResolvedValueOnce(page([makeProperty({ title: 'Reciente' })]));
    render(await RecentProperties());
    expect(screen.getByText('Reciente')).toBeInTheDocument();

    vi.mocked(api.getProperties).mockRejectedValueOnce(new api.ApiError(0, 'caído'));
    render(await RecentProperties());
    expect(screen.getByText('No pudimos cargar las propiedades')).toBeInTheDocument();

    vi.mocked(api.getProperties).mockResolvedValueOnce(page([]));
    render(await RecentProperties());
    expect(screen.getByText('Aún no hay propiedades publicadas')).toBeInTheDocument();
    renderWithProviders(HomePage());
  });

  it('about, 404, error y loaders', async () => {
    const reset = vi.fn();
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    render(
      <>
        <AboutPage />
        <NotFound />
        <ErrorPage error={Object.assign(new Error('x'), { digest: 'abc123' })} reset={reset} />
        <PropertiesLoading />
        <DetailLoading />
      </>,
    );
    expect(screen.getByRole('heading', { name: 'Cómo funciona Rynok' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'No encontramos esta página' })).toBeInTheDocument();
    expect(screen.getByText('Código: abc123')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reset).toHaveBeenCalled();
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
    spy.mockRestore();
  });
});
