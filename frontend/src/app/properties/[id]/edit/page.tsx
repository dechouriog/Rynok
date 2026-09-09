'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProperty, updateProperty } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useWallet();
  const [form, setForm] = useState({ title: '', description: '', location: '', priceEth: '', imageUrl: '' });

  useEffect(() => {
    getProperty(id).then((p) =>
      setForm({
        title: p.title,
        description: p.description,
        location: p.location,
        priceEth: p.priceEth,
        imageUrl: p.imageUrl ?? '',
      }),
    );
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    await updateProperty(id, form, token);
    router.push(`/properties/${id}`);
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Editar propiedad</h1>
      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="text-sm font-medium text-slate-700">Título</label>
          <input className={inputClass} value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Descripción</label>
          <textarea rows={4} className={inputClass} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Ubicación</label>
          <input className={inputClass} value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">Precio en ETH</label>
          <input className={inputClass} type="number" step="0.0001" value={form.priceEth}
            onChange={(e) => setForm({ ...form, priceEth: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">URL de imagen</label>
          <input className={inputClass} value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        </div>
        <button type="submit" className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Guardar cambios
        </button>
      </form>
    </div>
  );
}
