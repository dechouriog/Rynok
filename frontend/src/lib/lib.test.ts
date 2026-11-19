import { describe, it, expect, vi, afterEach } from 'vitest';
import { formatDate, formatEth, formatRelative, shortenAddress } from './format';
import { EMPTY_PROPERTY, toPropertyInput, validateProperty } from './validation';
import { parseFilters } from './filters';
import { isTokenExpired, sessionStore, tokenExpiresAt } from './session-store';
import { cn } from './cn';
import { fakeJwt } from '@/test/utils';

describe('format', () => {
  it('acorta direcciones y formatea ETH en español', () => {
    expect(shortenAddress('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')).toBe('0xf39f…2266');
    expect(shortenAddress('0x1234')).toBe('0x1234');
    expect(formatEth('2.5')).toBe('2,5 ETH');
    expect(formatEth('1500')).toBe('1.500 ETH');
    expect(formatEth('abc')).toBe('abc ETH');
  });

  it('formatea fechas y tiempos relativos', () => {
    const now = new Date('2026-11-13T12:00:00Z');
    expect(formatRelative(new Date('2026-11-16T12:00:00Z'), now)).toBe('dentro de 3 días');
    expect(formatRelative(new Date('2026-11-13T10:00:00Z'), now)).toBe('hace 2 horas');
    expect(formatRelative(new Date('2026-11-13T12:00:30Z'), now)).toBe('dentro de 30 segundos');
    expect(formatDate('2026-11-13T12:00:00Z', false)).toMatch(/2026/);
  });
});

describe('validateProperty', () => {
  const valid = {
    title: 'Casa con jardín',
    description: 'Tres habitaciones y patio amplio con árboles.',
    location: 'Envigado',
    priceEth: '2.5',
  };

  it('acepta un formulario válido y normaliza el precio con coma', () => {
    expect(validateProperty(valid)).toEqual({});
    expect(toPropertyInput({ ...valid, priceEth: ' 2,5 ' }, '/uploads/a.jpg')).toMatchObject({
      priceEth: '2.5',
      imageUrl: '/uploads/a.jpg',
    });
  });

  it('marca cada campo inválido con un mensaje en español', () => {
    const errors = validateProperty(EMPTY_PROPERTY);
    expect(Object.keys(errors).sort()).toEqual(['description', 'location', 'priceEth', 'title']);
    expect(errors.title).toMatch(/al menos 5/);
  });

  it.each(['0', '0.0', '-1', '1.1234567', 'abc', '10000000'])('rechaza el precio %s', (priceEth) => {
    expect(validateProperty({ ...valid, priceEth }).priceEth).toBeDefined();
  });

  it('valida longitudes máximas', () => {
    const errors = validateProperty({
      ...valid,
      title: 'x'.repeat(121),
      description: 'x'.repeat(2001),
      location: 'x'.repeat(121),
    });
    expect(Object.keys(errors).sort()).toEqual(['description', 'location', 'title']);
  });
});

describe('parseFilters', () => {
  it('conserva solo valores válidos', () => {
    expect(parseFilters({ q: ' casa ', minPrice: '2', maxPrice: 'abc', sort: 'hack', page: '-3' })).toEqual({
      q: 'casa',
      location: undefined,
      minPrice: '2',
      maxPrice: undefined,
      sort: undefined,
      page: 1,
    });
    expect(parseFilters({ sort: 'price_asc', page: ['2', '9'], location: '' })).toMatchObject({
      sort: 'price_asc',
      page: 2,
      location: undefined,
    });
  });
});

describe('session-store', () => {
  afterEach(() => vi.useRealTimers());

  it('lee la expiración del JWT', () => {
    const token = fakeJwt(60);
    expect(tokenExpiresAt(token)).toBeGreaterThan(Date.now());
    expect(isTokenExpired(token)).toBe(false);
    expect(isTokenExpired(fakeJwt(-10))).toBe(true);
    expect(tokenExpiresAt('basura')).toBeNull();
  });

  it('persiste la sesión y notifica a los suscriptores', () => {
    const listener = vi.fn();
    const unsubscribe = sessionStore.subscribe(listener);
    sessionStore.set({ token: fakeJwt(), address: '0xabc' });
    expect(listener).toHaveBeenCalled();
    sessionStore.reset();
    expect(sessionStore.getSnapshot()?.address).toBe('0xabc');
    unsubscribe();
    expect(sessionStore.getServerSnapshot()).toBeNull();
  });

  it('descarta una sesión guardada con el token vencido', () => {
    window.sessionStorage.setItem('rynok_session', JSON.stringify({ token: fakeJwt(-5), address: '0xabc' }));
    expect(sessionStore.getSnapshot()).toBeNull();
    expect(window.sessionStorage.getItem('rynok_session')).toBeNull();
  });
});

describe('utilidades', () => {
  it('cn combina clases y resuelve conflictos de Tailwind', () => {
    expect(cn('px-2', false, 'px-4', undefined)).toBe('px-4');
    expect(cn('rounded-card', 'rounded-full')).toBe('rounded-full');
  });
});
