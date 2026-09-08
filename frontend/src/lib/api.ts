const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function connectWallet(walletAddress: string, signature: string, message: string) {
  const res = await fetch(`${API_URL}/auth/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress, signature, message }),
  });
  if (!res.ok) throw new Error('No se pudo autenticar la wallet');
  return res.json() as Promise<{ accessToken: string; user: { id: string; walletAddress: string } }>;
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Sesión inválida');
  return res.json();
}

export type Property = {
  id: string;
  title: string;
  description: string;
  location: string;
  priceEth: string;
  imageUrl?: string;
  owner: { id: string; walletAddress: string };
  createdAt: string;
};

export async function getProperties(filters?: { q?: string; location?: string }): Promise<Property[]> {
  const params = new URLSearchParams(filters as any).toString();
  const res = await fetch(`${API_URL}/properties${params ? `?${params}` : ''}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('No se pudieron cargar las propiedades');
  return res.json();
}

export async function getProperty(id: string): Promise<Property> {
  const res = await fetch(`${API_URL}/properties/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Propiedad no encontrada');
  return res.json();
}

export async function createProperty(data: Partial<Property>, token: string) {
  const res = await fetch(`${API_URL}/properties`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('No se pudo crear la propiedad');
  return res.json();
}

export async function updateProperty(id: string, data: Partial<Property>, token: string) {
  const res = await fetch(`${API_URL}/properties/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('No se pudo actualizar la propiedad');
  return res.json();
}

export async function deleteProperty(id: string, token: string) {
  const res = await fetch(`${API_URL}/properties/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('No se pudo eliminar la propiedad');
  return res.json();
}