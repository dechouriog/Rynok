'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProperty } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';

export function PropertyForm() {
  const router = useRouter();
  const { token, connect } = useWallet();
  const [form, setForm] = useState({ title: '', description: '', location: '', priceEth: '' });
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Conecta tu wallet antes de publicar.');
      return;
    }
    try {
      await createProperty(form, token);
      router.push('/properties');
    } catch {
      setError('No se pudo publicar la propiedad. Intenta de nuevo.');
    }
  }

  if (!token) {
    return (
      <div className="text-center">
        <p className="mb-3">Necesitas conectar tu wallet para publicar una propiedad.</p>
        <button onClick={connect} className="bg-rynok-accent text-white px-4 py-2 rounded">
          Conectar wallet
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-3">
      <input required placeholder="Título" className="border p-2 rounded"
        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea required placeholder="Descripción" className="border p-2 rounded"
        value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input required placeholder="Ubicación" className="border p-2 rounded"
        value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <input required placeholder="Precio en ETH" type="number" step="0.0001" className="border p-2 rounded"
        value={form.priceEth} onChange={(e) => setForm({ ...form, priceEth: e.target.value })} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button type="submit" className="bg-rynok-primary text-white py-2 rounded">Publicar</button>
    </form>
  );
}