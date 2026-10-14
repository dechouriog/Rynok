'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';
import { createProperty } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import { ImageInput, resolveImageUrl, type ImageValue } from '@/components/ImageInput';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export function PropertyForm() {
  const router = useRouter();
  const { token, connect, isConnecting } = useWallet();
  const [form, setForm] = useState({ title: '', description: '', location: '', priceEth: '' });
  const [image, setImage] = useState<ImageValue>({ file: null, url: '' });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Conecta tu wallet antes de publicar.');
      return;
    }
    setSubmitting(true);
    try {
      // La imagen se sube recién al publicar: si el usuario cambia de idea antes,
      // no quedan archivos huérfanos en el servidor.
      const imageUrl = await resolveImageUrl(image, token);
      await createProperty({ ...form, ...(imageUrl ? { imageUrl } : {}) }, token);
      router.push('/properties');
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo publicar la propiedad. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md rounded-xl border border-slate-200 p-8 text-center">
        <Wallet className="mx-auto mb-3 h-8 w-8 text-slate-400" />
        <p className="mb-4 text-slate-600">Necesitas conectar tu wallet para publicar una propiedad.</p>
        <button
          onClick={connect}
          disabled={isConnecting}
          className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
        >
          {isConnecting ? 'Conectando...' : 'Conectar wallet'}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-5">
      <div>
        <label className="text-sm font-medium text-slate-700">Título</label>
        <input
          required
          placeholder="Apartamento moderno en El Poblado"
          className={inputClass}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Descripción</label>
        <textarea
          required
          rows={4}
          placeholder="Describe la propiedad, sus amenidades y estado actual."
          className={inputClass}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Ubicación</label>
        <input
          required
          placeholder="Medellín, Colombia"
          className={inputClass}
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-slate-700">Precio en ETH</label>
        <input
          required
          type="number"
          step="0.0001"
          placeholder="3.5"
          className={inputClass}
          value={form.priceEth}
          onChange={(e) => setForm({ ...form, priceEth: e.target.value })}
        />
      </div>

      <ImageInput value={image} onChange={setImage} />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
      >
        {submitting ? 'Publicando...' : 'Confirmar y publicar'}
      </button>
    </form>
  );
}
