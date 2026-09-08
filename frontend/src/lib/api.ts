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