import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  confirmEscrowRelease,
  connectWallet,
  createProperty,
  DEFAULT_PROPERTY_IMAGE,
  deleteProperty,
  formatEth,
  imageSrc,
  uploadImage,
  getMyTransactions,
  getProperties,
  getProperty,
  recordEscrowDeposit,
  refundEscrow,
  requestLoginMessage,
  updateProperty,
} from '../api';

const fetchMock = vi.fn();

function reply(status: number, body: unknown) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('formatEth', () => {
  it('quita los ceros de relleno de PostgreSQL', () => {
    expect(formatEth('1.500000')).toBe('1.5');
    expect(formatEth('3.000000')).toBe('3');
    expect(formatEth('0.001000')).toBe('0.001');
    expect(formatEth('10')).toBe('10');
  });
});

describe('imágenes', () => {
  it('las imágenes subidas se sirven desde el backend; las externas no cambian', () => {
    expect(imageSrc('/uploads/a.png')).toBe('http://localhost:3001/uploads/a.png');
    expect(imageSrc('https://ejemplo.com/a.jpg')).toBe('https://ejemplo.com/a.jpg');
    expect(imageSrc('')).toBe(DEFAULT_PROPERTY_IMAGE);
    expect(imageSrc(undefined)).toBe(DEFAULT_PROPERTY_IMAGE);
  });

  it('sube la imagen como multipart con el token', async () => {
    reply(201, { url: '/uploads/a.png' });
    const file = new File([new Uint8Array(4)], 'a.png', { type: 'image/png' });

    await expect(uploadImage(file, 'jwt')).resolves.toBe('/uploads/a.png');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/uploads\/images$/);
    expect(init.headers.Authorization).toBe('Bearer jwt');
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('muestra el motivo si el backend rechaza la imagen', async () => {
    reply(400, { message: 'Formato no soportado: usa JPG, PNG, WebP o GIF' });
    const file = new File(['x'], 'a.png', { type: 'image/png' });
    await expect(uploadImage(file, 'jwt')).rejects.toThrow('Formato no soportado');
  });
});

describe('auth', () => {
  it('pide el mensaje con nonce para la wallet', async () => {
    reply(201, { message: 'Iniciar sesión en Rynok\nNonce: abc' });

    await expect(requestLoginMessage('0xabc')).resolves.toBe('Iniciar sesión en Rynok\nNonce: abc');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/auth\/nonce$/);
    expect(JSON.parse(init.body)).toEqual({ walletAddress: '0xabc' });
  });

  it('envía la firma y el mensaje al conectar', async () => {
    reply(201, { accessToken: 'jwt', user: { id: '1', walletAddress: '0xabc' } });

    await expect(connectWallet('0xabc', '0xfirma', 'msg')).resolves.toMatchObject({ accessToken: 'jwt' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ walletAddress: '0xabc', signature: '0xfirma', message: 'msg' });
  });

  it('lanza error si la firma es rechazada', async () => {
    reply(401, { message: 'Firma inválida' });
    await expect(connectWallet('0xabc', '0x', 'msg')).rejects.toThrow('No se pudo autenticar la wallet');
  });
});

describe('propiedades', () => {
  it('omite los filtros vacíos en la búsqueda', async () => {
    reply(200, []);

    await getProperties({ q: 'casa', location: '', minPrice: '2', maxPrice: undefined });

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/properties\?q=casa&minPrice=2$/);
  });

  it('lanza error si la propiedad no existe', async () => {
    reply(404, { message: 'Property x not found' });
    await expect(getProperty('x')).rejects.toThrow('Propiedad no encontrada');
  });

  it('crea, edita y elimina con el token del usuario', async () => {
    reply(201, { id: '1' });
    reply(200, { id: '1' });
    reply(200, { deleted: true });

    await createProperty({ title: 'Casa' }, 'jwt');
    await updateProperty('1', { priceEth: '2' }, 'jwt');
    await deleteProperty('1', 'jwt');

    expect(fetchMock.mock.calls.map(([, init]) => [init.method, init.headers.Authorization])).toEqual([
      ['POST', 'Bearer jwt'],
      ['PATCH', 'Bearer jwt'],
      ['DELETE', 'Bearer jwt'],
    ]);
  });

  it('muestra el motivo que da el backend al rechazar una edición', async () => {
    reply(409, { message: 'No se puede editar una propiedad en escrow o vendida' });
    await expect(updateProperty('1', {}, 'jwt')).rejects.toThrow('No se puede editar una propiedad en escrow o vendida');
  });
});

describe('escrow', () => {
  const deposit = {
    propertyId: 'p1', buyerWallet: '0xb', sellerWallet: '0xs',
    amountEth: '1', contractAddress: '0xc', depositTxHash: '0xh',
  };

  it('registra el depósito y devuelve el motivo si el backend lo rechaza', async () => {
    reply(201, { id: 't1' });
    await expect(recordEscrowDeposit(deposit, 'jwt')).resolves.toEqual({ id: 't1' });

    reply(400, { message: 'La transacción no contiene el evento Deposited esperado' });
    await expect(recordEscrowDeposit(deposit, 'jwt')).rejects.toThrow('La transacción no contiene el evento Deposited esperado');
  });

  it('une los mensajes de validación del backend', async () => {
    reply(400, { message: ['depositTxHash debe ser un hash de transacción válido', 'propertyId must be a UUID'] });
    await expect(recordEscrowDeposit(deposit, 'jwt')).rejects.toThrow(
      'depositTxHash debe ser un hash de transacción válido, propertyId must be a UUID',
    );
  });

  it('confirma la liberación y el reembolso con el hash on-chain', async () => {
    reply(201, { status: 'COMPLETE' });
    reply(201, { status: 'REFUNDED' });

    await confirmEscrowRelease('p1', '0xrel', 'jwt');
    await refundEscrow('p1', '0xref', 'jwt');

    expect(fetchMock.mock.calls[0][0]).toMatch(/\/escrow\/p1\/confirm$/);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ releaseTxHash: '0xrel' });
    expect(fetchMock.mock.calls[1][0]).toMatch(/\/escrow\/p1\/refund$/);
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ refundTxHash: '0xref' });
  });

  it('carga el historial del usuario', async () => {
    reply(200, [{ id: 't1' }]);
    await expect(getMyTransactions('jwt')).resolves.toHaveLength(1);

    reply(500, {});
    await expect(getMyTransactions('jwt')).rejects.toThrow('No se pudo cargar el historial de transacciones');
  });
});
