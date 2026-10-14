const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Mensaje de un solo uso (con nonce) que la wallet debe firmar para iniciar sesión. */
export async function requestLoginMessage(walletAddress: string) {
  const res = await fetch(`${API_URL}/auth/nonce`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });

  if (!res.ok) {
    throw new Error('No se pudo iniciar el login');
  }

  const { message } = (await res.json()) as { message: string };
  return message;
}

export async function connectWallet(
  walletAddress: string,
  signature: string,
  message: string,
) {
  const res = await fetch(`${API_URL}/auth/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      signature,
      message,
    }),
  });

  if (!res.ok) {
    throw new Error('No se pudo autenticar la wallet');
  }

  return res.json() as Promise<{
    accessToken: string;
    user: {
      id: string;
      walletAddress: string;
    };
  }>;
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('Sesión inválida');
  }

  return res.json();
}

export type Property = {
  id: string;
  title: string;
  description: string;
  location: string;
  priceEth: string;
  imageUrl?: string;
  status?: 'AVAILABLE' | 'IN_ESCROW' | 'SOLD';
  owner: {
    id: string;
    walletAddress: string;
  };
  createdAt: string;
};

export const DEFAULT_PROPERTY_IMAGE =
  'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1000&q=60';

/** Las imágenes subidas se guardan como "/uploads/..." y las sirve el backend. */
export function imageSrc(url?: string | null) {
  if (!url) return DEFAULT_PROPERTY_IMAGE;
  return url.startsWith('/uploads/') ? `${API_URL}${url}` : url;
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/** Sube una imagen y devuelve la URL a guardar en la propiedad. */
export async function uploadImage(file: File, token: string) {
  const body = new FormData();
  body.append('file', file);

  const res = await fetch(`${API_URL}/uploads/images`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res, 'No se pudo subir la imagen'));
  }

  const { url } = (await res.json()) as { url: string };
  return url;
}

/** PostgreSQL devuelve los decimales con ceros de relleno ("1.500000" -> "1.5"). */
export function formatEth(value: string) {
  return value.includes('.') ? value.replace(/\.?0+$/, '') : value;
}

export async function getProperties(filters?: {
  q?: string;
  location?: string;
  minPrice?: string;
  maxPrice?: string;
}): Promise<Property[]> {
  const clean = Object.fromEntries(
    Object.entries(filters ?? {}).filter(([, value]) => Boolean(value)),
  );

  const params = new URLSearchParams(clean).toString();

  const res = await fetch(
    `${API_URL}/properties${params ? `?${params}` : ''}`,
    {
      cache: 'no-store',
    },
  );

  if (!res.ok) {
    throw new Error('No se pudieron cargar las propiedades');
  }

  return res.json();
}

export async function getProperty(id: string): Promise<Property> {
  const res = await fetch(`${API_URL}/properties/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Propiedad no encontrada');
  }

  return res.json();
}

export async function createProperty(
  data: Partial<Property>,
  token: string,
) {
  const res = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res, 'No se pudo crear la propiedad'));
  }

  return res.json();
}

export async function updateProperty(
  id: string,
  data: Partial<Property>,
  token: string,
) {
  const res = await fetch(`${API_URL}/properties/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res, 'No se pudo actualizar la propiedad'));
  }

  return res.json();
}

export async function deleteProperty(
  id: string,
  token: string,
) {
  const res = await fetch(`${API_URL}/properties/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error('No se pudo eliminar la propiedad');
  }

  return res.json();
}

export async function recordEscrowDeposit(
  data: {
    propertyId: string;
    buyerWallet: string;
    sellerWallet: string;
    amountEth: string;
    contractAddress: string;
    depositTxHash: string;
  },
  token: string,
) {
  const res = await fetch(`${API_URL}/escrow/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res, 'No se pudo registrar el depósito'));
  }

  return res.json();
}

async function errorMessage(res: Response, fallback: string) {
  try {
    const body = await res.json();
    return Array.isArray(body.message) ? body.message.join(', ') : body.message ?? fallback;
  } catch {
    return fallback;
  }
}

export async function confirmEscrowRelease(
  propertyId: string,
  releaseTxHash: string,
  token: string,
) {
  const res = await fetch(`${API_URL}/escrow/${propertyId}/confirm`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ releaseTxHash }),
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res, 'No se pudo registrar la liberación de fondos'));
  }

  return res.json() as Promise<EscrowTransaction>;
}

export async function refundEscrow(
  propertyId: string,
  refundTxHash: string,
  token: string,
) {
  const res = await fetch(`${API_URL}/escrow/${propertyId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ refundTxHash }),
  });

  if (!res.ok) {
    throw new Error(await errorMessage(res, 'No se pudo registrar el reembolso'));
  }

  return res.json() as Promise<EscrowTransaction>;
}

export type EscrowTransaction = {
  id: string;
  propertyId: string;
  buyerWallet: string;
  sellerWallet: string;
  amountEth: string;
  status: 'AWAITING_DELIVERY' | 'COMPLETE' | 'REFUNDED';
  depositTxHash: string;
  releaseTxHash?: string;
  refundTxHash?: string;
  createdAt: string;
};

export async function getMyTransactions(
  token: string,
): Promise<EscrowTransaction[]> {
  const res = await fetch(
    `${API_URL}/escrow/my-transactions`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!res.ok) {
    throw new Error(
      'No se pudo cargar el historial de transacciones',
    );
  }

  return res.json();
}