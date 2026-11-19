import { describe, it, expect, vi, afterEach } from 'vitest';
import * as api from './api';

function mockFetch(status: number, body: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('api', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('construye la consulta solo con filtros definidos', async () => {
    const fetchMock = mockFetch(200, { items: [], total: 0, page: 1, limit: 9, totalPages: 1 });
    await api.getProperties({ q: 'casa', location: '', minPrice: undefined, page: 2 });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/properties?q=casa&page=2',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('envía el token y el cuerpo JSON en las mutaciones', async () => {
    const fetchMock = mockFetch(201, { id: '1' });
    await api.createProperty({ title: 't', description: 'd', location: 'l', priceEth: '1' }, 'jwt');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ Authorization: 'Bearer jwt', 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body)).toMatchObject({ title: 't' });
  });

  it.each([
    ['updateProperty', () => api.updateProperty('p1', { title: 'x' }, 't'), '/properties/p1', 'PATCH'],
    ['deleteProperty', () => api.deleteProperty('p1', 't'), '/properties/p1', 'DELETE'],
    ['getMyProperties', () => api.getMyProperties('t'), '/properties/mine', 'GET'],
    ['getMe', () => api.getMe('t'), '/auth/me', 'GET'],
    ['connectWallet', () => api.connectWallet('0x1', '0xs', 'm'), '/auth/connect', 'POST'],
    [
      'recordEscrowDeposit',
      () =>
        api.recordEscrowDeposit(
          { propertyId: 'p1', amountEth: '1', contractAddress: '0xc', depositTxHash: '0xh' },
          't',
        ),
      '/escrow/deposit',
      'POST',
    ],
    ['confirmEscrowRelease', () => api.confirmEscrowRelease('p1', '0xh', 't'), '/escrow/p1/confirm', 'POST'],
    ['refundEscrow', () => api.refundEscrow('p1', '0xh', 't'), '/escrow/p1/refund', 'POST'],
    ['getMyTransactions', () => api.getMyTransactions('t'), '/escrow/my-transactions', 'GET'],
  ])('%s llama al endpoint correcto', async (_, call, path, method) => {
    const fetchMock = mockFetch(200, {});
    await call();
    expect(fetchMock).toHaveBeenCalledWith(`http://api.test${path}`, expect.objectContaining({ method }));
  });

  it('convierte los errores de la API en ApiError con mensaje en español', async () => {
    mockFetch(400, { message: ['El título debe tener al menos 5 caracteres', 'precio inválido'] });
    await expect(
      api.createProperty({ title: 'x', description: '', location: '', priceEth: '' }, 't'),
    ).rejects.toMatchObject({
      status: 400,
      message: 'El título debe tener al menos 5 caracteres',
      details: ['El título debe tener al menos 5 caracteres', 'precio inválido'],
    });
    mockFetch(409, { message: 'La propiedad no está disponible para compra' });
    await expect(api.confirmEscrowRelease('p', '0x', 't')).rejects.toThrow(
      'La propiedad no está disponible para compra',
    );
    mockFetch(500, null);
    await expect(api.getMe('t')).rejects.toThrow(/El servidor tuvo un problema/);
    mockFetch(418, {});
    await expect(api.getMe('t')).rejects.toThrow('La solicitud no se pudo completar.');
  });

  it('informa cuando el backend no responde (status 0)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api.getProperties()).rejects.toMatchObject({ status: 0, message: api.NETWORK_ERROR_MESSAGE });
  });

  it('getProperty devuelve null en 404/400 y relanza otros errores', async () => {
    mockFetch(404, { message: 'La propiedad no existe' });
    await expect(api.getProperty('x')).resolves.toBeNull();
    mockFetch(400, { message: 'uuid' });
    await expect(api.getProperty('x')).resolves.toBeNull();
    mockFetch(500, {});
    await expect(api.getProperty('x')).rejects.toBeInstanceOf(api.ApiError);
    mockFetch(200, { id: 'p1' });
    await expect(api.getProperty('p1')).resolves.toEqual({ id: 'p1' });
  });

  it('requestLoginMessage pide el nonce al servidor', async () => {
    const fetchMock = mockFetch(201, { message: 'Iniciar sesión en Rynok' });
    await expect(api.requestLoginMessage('0xabc')).resolves.toBe('Iniciar sesión en Rynok');
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/auth/nonce', expect.objectContaining({ method: 'POST' }));
  });

  it('uploadImage envía multipart sin Content-Type manual y devuelve la URL', async () => {
    const fetchMock = mockFetch(201, { url: '/uploads/a.jpg' });
    await expect(api.uploadImage(new File(['x'], 'a.jpg', { type: 'image/jpeg' }), 't')).resolves.toBe(
      '/uploads/a.jpg',
    );
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://api.test/uploads/images');
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.headers).toEqual({ Authorization: 'Bearer t' });
  });

  it('imageSrc antepone la API a las imágenes subidas y respeta URLs externas', () => {
    expect(api.imageSrc('/uploads/a.jpg')).toBe('http://api.test/uploads/a.jpg');
    expect(api.imageSrc('https://img.test/a.jpg')).toBe('https://img.test/a.jpg');
    expect(api.imageSrc(null)).toBeNull();
  });
});
