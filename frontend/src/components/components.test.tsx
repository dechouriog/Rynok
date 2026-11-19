import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as api from '@/lib/api';
import { PropertyCard } from './PropertyCard';
import { PropertyFilters } from './PropertyFilters';
import { PropertyForm } from './PropertyForm';
import { Pagination } from './Pagination';
import { ConnectWalletButton } from './ConnectWalletButton';
import { RequireWallet } from './RequireWallet';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Hero } from './Hero';
import { HowItWorks } from './HowItWorks';
import { MobileMenu } from './layout/MobileMenu';
import { AccountShell } from './layout/AccountShell';
import { isActive } from './layout/nav-items';
import { PropertyStatusBadge, EscrowStatusBadge } from './property/StatusBadge';
import { installFakeEthereum, makeProperty, renderWithProviders, startSession, BUYER } from '@/test/utils';

const push = vi.fn();
const refresh = vi.fn();
let searchParams = new URLSearchParams();
let pathname = '/properties';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
  useSearchParams: () => searchParams,
  usePathname: () => pathname,
}));

vi.mock('@/lib/api', async (original) => ({
  ...(await original<typeof import('@/lib/api')>()),
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
  getMe: vi.fn().mockResolvedValue({ id: 'u1', walletAddress: '0x' }),
}));

beforeEach(() => {
  searchParams = new URLSearchParams();
  pathname = '/properties';
});

const PLACEHOLDER = /\/placeholder-property\.svg$/;

describe('PropertyCard', () => {
  it('muestra título, ubicación, precio formateado, estado y enlace', () => {
    render(<PropertyCard property={makeProperty({ priceEth: '3' })} />);
    expect(screen.getByRole('link', { name: 'Apartamento en El Poblado' })).toHaveAttribute(
      'href',
      '/properties/09daa0ae-8cd2-4416-8156-fe4328c701a2',
    );
    expect(screen.getByText('Medellín')).toBeInTheDocument();
    expect(screen.getByText('3 ETH')).toBeInTheDocument();
    expect(screen.getByText('Disponible')).toBeInTheDocument();
    expect(screen.getByAltText('Foto de Apartamento en El Poblado')).toHaveAttribute(
      'src',
      expect.stringMatching(PLACEHOLDER),
    );
  });

  it('usa la imagen local si la remota falla', async () => {
    render(<PropertyCard property={makeProperty({ imageUrl: 'https://img.test/casa.jpg' })} />);
    const img = screen.getByAltText(/Foto de/);
    expect(img).toHaveAttribute('src', 'https://img.test/casa.jpg');
    act(() => img.dispatchEvent(new Event('error')));
    await waitFor(() => expect(img).toHaveAttribute('src', expect.stringMatching(PLACEHOLDER)));
  });
});

describe('badges de estado', () => {
  it.each([
    ['SOLD', 'Vendida'],
    ['IN_ESCROW', 'En escrow'],
    ['AVAILABLE', 'Disponible'],
  ] as const)('%s → %s', (status, label) => {
    render(<PropertyStatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it('escrow', () => {
    render(<EscrowStatusBadge status="REFUNDED" />);
    expect(screen.getByText('Reembolsada')).toBeInTheDocument();
  });
});

describe('PropertyFilters', () => {
  it('envía búsqueda y ubicación en la URL, reiniciando la página', async () => {
    searchParams = new URLSearchParams('page=3&sort=price_asc');
    render(<PropertyFilters />);
    await userEvent.type(screen.getByLabelText('Buscar'), 'casa');
    await userEvent.type(screen.getByLabelText('Ubicación'), 'Envigado');
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }));
    expect(push).toHaveBeenCalledWith('/properties?sort=price_asc&q=casa&location=Envigado', { scroll: false });
  });

  it('aplica rangos de precio abiertos y orden', async () => {
    render(<PropertyFilters />);
    await userEvent.selectOptions(screen.getByLabelText('Rango de precio'), 'Más de 5 ETH');
    expect(push).toHaveBeenLastCalledWith('/properties?minPrice=5', { scroll: false });
    await userEvent.selectOptions(screen.getByLabelText('Ordenar por'), 'Precio: mayor a menor');
    expect(push).toHaveBeenLastCalledWith('/properties?sort=price_desc', { scroll: false });
  });

  it('recuerda el rango actual y permite limpiar filtros', async () => {
    searchParams = new URLSearchParams('minPrice=2&maxPrice=5&q=loft');
    render(<PropertyFilters />);
    expect(screen.getByLabelText('Rango de precio')).toHaveDisplayValue('2 a 5 ETH');
    expect(screen.getByLabelText('Buscar')).toHaveValue('loft');
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }));
    expect(push).toHaveBeenLastCalledWith('/properties', { scroll: false });
  });
});

describe('PropertyForm', () => {
  beforeEach(() => {
    installFakeEthereum();
    startSession(BUYER);
  });

  it('valida en el cliente y enfoca el primer error', async () => {
    renderWithProviders(<PropertyForm />);
    await userEvent.click(screen.getByRole('button', { name: 'Publicar propiedad' }));
    expect(screen.getByLabelText(/Título/)).toHaveFocus();
    expect(screen.getByText(/al menos 5 caracteres/)).toBeInTheDocument();
    expect(api.createProperty).not.toHaveBeenCalled();
    await userEvent.type(screen.getByLabelText(/Título/), 'Casa');
    expect(screen.queryByText(/al menos 5 caracteres/)).not.toBeInTheDocument();
  });

  it('publica y redirige al detalle', async () => {
    vi.mocked(api.createProperty).mockResolvedValue(makeProperty({ id: 'nueva' }));
    renderWithProviders(<PropertyForm />);
    await userEvent.type(screen.getByLabelText(/Título/), 'Casa con jardín');
    await userEvent.type(screen.getByLabelText(/Descripción/), 'Tres habitaciones y patio amplio con árboles.');
    await userEvent.type(screen.getByLabelText(/Ubicación/), 'Envigado');
    await userEvent.type(screen.getByLabelText(/Precio en ETH/), '2,5');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar propiedad' }));
    await waitFor(() => expect(push).toHaveBeenCalledWith('/properties/nueva'));
    expect(vi.mocked(api.createProperty).mock.calls[0][0]).toMatchObject({ priceEth: '2.5', imageUrl: '' });
    expect(screen.getByText('Propiedad publicada')).toBeInTheDocument();
  });

  it('edita y avisa que hay que actualizar el precio on-chain', async () => {
    const property = makeProperty();
    vi.mocked(api.updateProperty).mockResolvedValue({ ...property, priceEth: '3' });
    renderWithProviders(<PropertyForm property={property} />);
    const price = screen.getByLabelText(/Precio en ETH/);
    await userEvent.clear(price);
    await userEvent.type(price, '3');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(screen.getByText(/Actualizar precio on-chain/)).toBeInTheDocument());
    expect(api.updateProperty).toHaveBeenCalledWith(
      property.id,
      expect.objectContaining({ priceEth: '3' }),
      expect.any(String),
    );
  });

  it('muestra los errores del servidor', async () => {
    vi.mocked(api.createProperty).mockRejectedValue(new api.ApiError(400, 'a', ['Error uno', 'Error dos']));
    renderWithProviders(<PropertyForm />);
    await userEvent.type(screen.getByLabelText(/Título/), 'Casa con jardín');
    await userEvent.type(screen.getByLabelText(/Descripción/), 'Tres habitaciones y patio amplio con árboles.');
    await userEvent.type(screen.getByLabelText(/Ubicación/), 'Envigado');
    await userEvent.type(screen.getByLabelText(/Precio en ETH/), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Publicar propiedad' }));
    expect(await screen.findByText('Error uno · Error dos')).toBeInTheDocument();
  });
});

describe('Pagination', () => {
  it('conserva filtros, marca la página actual y omite páginas lejanas', () => {
    render(<Pagination page={5} totalPages={10} params={{ q: 'casa', sort: undefined }} />);
    expect(screen.getByRole('link', { name: 'Página 5' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Página 1' })).toHaveAttribute('href', '/properties?q=casa');
    expect(screen.getByRole('link', { name: /Siguiente/ })).toHaveAttribute('href', '/properties?q=casa&page=6');
    expect(screen.queryByRole('link', { name: 'Página 8' })).not.toBeInTheDocument();
  });

  it('no se muestra con una sola página y deshabilita los extremos', () => {
    const { container } = render(<Pagination page={1} totalPages={1} params={{}} />);
    expect(container).toBeEmptyDOMElement();
    render(<Pagination page={2} totalPages={2} params={{}} />);
    expect(screen.queryByRole('link', { name: /Siguiente/ })).not.toBeInTheDocument();
  });
});

describe('ConnectWalletButton', () => {
  it('sin MetaMask ofrece instalarlo', () => {
    renderWithProviders(<ConnectWalletButton />);
    expect(screen.getByRole('link', { name: /Instalar MetaMask/ })).toHaveAttribute(
      'href',
      'https://metamask.io/download/',
    );
  });

  it('con MetaMask y sin sesión ofrece conectar', () => {
    installFakeEthereum();
    renderWithProviders(<ConnectWalletButton />);
    expect(screen.getByRole('button', { name: 'Conectar wallet' })).toBeInTheDocument();
  });

  it('con sesión muestra la dirección corta', () => {
    installFakeEthereum();
    startSession(BUYER);
    renderWithProviders(<ConnectWalletButton />);
    expect(screen.getByRole('link', { name: `Wallet conectada ${BUYER}` })).toHaveTextContent('0x7099…79c8');
  });

  it('en la red equivocada ofrece cambiar', async () => {
    installFakeEthereum({ chainId: 1 });
    startSession(BUYER);
    renderWithProviders(<ConnectWalletButton />);
    expect(await screen.findByRole('button', { name: 'Cambiar a Hardhat local' })).toBeInTheDocument();
  });
});

describe('RequireWallet', () => {
  it('pide conectar y luego muestra el contenido', () => {
    installFakeEthereum();
    renderWithProviders(
      <RequireWallet title="Conecta" description="Necesitas wallet">
        secreto
      </RequireWallet>,
    );
    expect(screen.getByRole('heading', { name: 'Conecta' })).toBeInTheDocument();
    expect(screen.queryByText('secreto')).not.toBeInTheDocument();
  });

  it('sin MetaMask enlaza a la instalación', () => {
    renderWithProviders(
      <RequireWallet title="Conecta" description="x">
        secreto
      </RequireWallet>,
    );
    expect(screen.getByRole('link', { name: /Instalar MetaMask/ })).toBeInTheDocument();
  });
});

describe('layout', () => {
  it('Navbar, Footer, Hero y HowItWorks renderizan su navegación', () => {
    renderWithProviders(
      <>
        <Navbar />
        <Hero />
        <HowItWorks />
        <Footer />
      </>,
    );
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explorar' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Bienes raíces/);
    expect(screen.getByRole('heading', { name: 'Cómo funciona' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Mi cuenta' })).toBeInTheDocument();
  });

  it('el menú móvil abre, muestra secciones y se cierra con Escape', async () => {
    render(<MobileMenu />);
    const toggle = screen.getByRole('button', { name: 'Abrir menú' });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation', { name: 'Menú móvil' })).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('navigation', { name: 'Menú móvil' })).not.toBeInTheDocument();
  });

  it('AccountShell marca la sección activa', () => {
    pathname = '/escrow';
    render(<AccountShell>contenido</AccountShell>);
    expect(screen.getByRole('link', { name: /Compras y ventas/ })).toHaveAttribute('aria-current', 'page');
  });

  it('isActive distingue el detalle de propiedades de publicar', () => {
    expect(isActive('/properties/abc', '/properties')).toBe(true);
    expect(isActive('/properties/new', '/properties')).toBe(false);
    expect(isActive('/properties/new', '/properties/new')).toBe(true);
    expect(isActive('/dashboard', '/escrow')).toBe(false);
  });
});
