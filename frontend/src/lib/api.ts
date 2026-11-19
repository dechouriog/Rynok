/**
 * Cliente HTTP de la API de Rynok. Todas las funciones lanzan `ApiError` con un mensaje en español
 * listo para mostrar, y `status` 0 cuando el backend no responde.
 */

// En el servidor (Server Components, Docker) puede usarse una URL interna distinta a la pública.
export const API_URL =
  (typeof window === 'undefined' ? process.env.API_URL_INTERNAL : undefined) ??
  process.env.NEXT_PUBLIC_API_URL ??
  'http://localhost:3001';

/** URL pública de la API (la que ve el navegador), para recursos como las imágenes subidas. */
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export type PropertyStatus = 'AVAILABLE' | 'IN_ESCROW' | 'SOLD';
export type EscrowStatus = 'AWAITING_DELIVERY' | 'COMPLETE' | 'REFUNDED';

export type User = { id: string; walletAddress: string; displayName?: string | null };

export type Property = {
  id: string;
  title: string;
  description: string;
  location: string;
  priceEth: string;
  imageUrl?: string | null;
  status: PropertyStatus;
  owner: User;
  createdAt: string;
  updatedAt?: string;
};

export type Page<T> = { items: T[]; total: number; page: number; limit: number; totalPages: number };

export type EscrowTransaction = {
  id: string;
  propertyId: string;
  /** null si el vendedor eliminó la propiedad después de liquidar la operación. */
  property?: Property | null;
  buyerWallet: string;
  sellerWallet: string;
  amountEth: string;
  contractAddress: string;
  status: EscrowStatus;
  depositTxHash: string;
  releaseTxHash?: string | null;
  refundTxHash?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type PropertyInput = {
  title: string;
  description: string;
  location: string;
  priceEth: string;
  imageUrl?: string;
};

export type SortOption = 'recent' | 'price_asc' | 'price_desc';
export type PropertyFilters = {
  q?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
  status?: PropertyStatus;
  sort?: SortOption;
  page?: string | number;
  limit?: string | number;
};

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const NETWORK_ERROR_MESSAGE =
  'No pudimos conectar con el servidor de Rynok. Revisa tu conexión e inténtalo de nuevo.';

type RequestOptions = { method?: string; token?: string; body?: unknown };

async function request<T>(path: string, { method = 'GET', token, body }: RequestOptions = {}): Promise<T> {
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      cache: 'no-store',
      headers: {
        ...(body !== undefined && !isForm ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, NETWORK_ERROR_MESSAGE);
  }

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const raw = (data as { message?: unknown } | null)?.message;
    const details = Array.isArray(raw) ? raw.map(String) : [];
    const message =
      typeof raw === 'string'
        ? raw
        : (details[0] ??
          (res.status >= 500
            ? 'El servidor tuvo un problema. Inténtalo de nuevo en un momento.'
            : 'La solicitud no se pudo completar.'));
    throw new ApiError(res.status, message, details);
  }
  return data as T;
}

function query(params: Record<string, string | number | undefined>): string {
  const clean = Object.entries(params).filter(([, v]) => v !== undefined && v !== '');
  return clean.length ? `?${new URLSearchParams(clean.map(([k, v]) => [k, String(v)])).toString()}` : '';
}

// --- Auth (nonce de un solo uso → firma → JWT) ---
export async function requestLoginMessage(walletAddress: string) {
  const { message } = await request<{ message: string }>('/auth/nonce', { method: 'POST', body: { walletAddress } });
  return message;
}

export function connectWallet(walletAddress: string, signature: string, message: string) {
  return request<{ accessToken: string; user: User }>('/auth/connect', {
    method: 'POST',
    body: { walletAddress, signature, message },
  });
}

export function getMe(token: string) {
  return request<User>('/auth/me', { token });
}

// --- Imágenes ---
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Las imágenes subidas se guardan como "/uploads/..." y las sirve el backend. */
export function imageSrc(url?: string | null): string | null {
  if (!url) return null;
  return url.startsWith('/uploads/') ? `${PUBLIC_API_URL}${url}` : url;
}

/** Sube una imagen y devuelve la URL a guardar en la propiedad. */
export async function uploadImage(file: File, token: string) {
  const body = new FormData();
  body.append('file', file);
  const { url } = await request<{ url: string }>('/uploads/images', { method: 'POST', token, body });
  return url;
}

// --- Propiedades ---
export function getProperties(filters: PropertyFilters = {}) {
  return request<Page<Property>>(`/properties${query(filters)}`);
}

/** Devuelve null si el id no es válido o la propiedad no existe (para usar notFound()). */
export async function getProperty(id: string): Promise<Property | null> {
  try {
    return await request<Property>(`/properties/${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) return null;
    throw error;
  }
}

export function getMyProperties(token: string) {
  return request<Property[]>('/properties/mine', { token });
}

export function createProperty(data: PropertyInput, token: string) {
  return request<Property>('/properties', { method: 'POST', token, body: data });
}

export function updateProperty(id: string, data: Partial<PropertyInput>, token: string) {
  return request<Property>(`/properties/${id}`, { method: 'PATCH', token, body: data });
}

export function deleteProperty(id: string, token: string) {
  return request<{ deleted: true }>(`/properties/${id}`, { method: 'DELETE', token });
}

// --- Escrow (el backend verifica cada hash contra el contrato) ---
export function recordEscrowDeposit(
  data: { propertyId: string; amountEth: string; contractAddress: string; depositTxHash: string },
  token: string,
) {
  return request<EscrowTransaction>('/escrow/deposit', { method: 'POST', token, body: data });
}

export function confirmEscrowRelease(propertyId: string, releaseTxHash: string, token: string) {
  return request<EscrowTransaction>(`/escrow/${propertyId}/confirm`, {
    method: 'POST',
    token,
    body: { releaseTxHash },
  });
}

export function refundEscrow(propertyId: string, refundTxHash: string, token: string) {
  return request<EscrowTransaction>(`/escrow/${propertyId}/refund`, { method: 'POST', token, body: { refundTxHash } });
}

export function getMyTransactions(token: string) {
  return request<EscrowTransaction[]>('/escrow/my-transactions', { token });
}
