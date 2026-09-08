'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProperty, updateProperty } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token } = useWallet();
  const [form, setForm] = useState({ title: '', description: '', location: '', priceEth: '' });

  useEffect(() => {
    getProperty(id).then((p) =>
      setForm({ title: p.title, description: p.description, location: p.location, priceEth: p.priceEth }),
    );
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    await updateProperty(id, form, token);
    router.push(`/properties/${id}`);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto flex flex-col gap-3">
      <input className="border p-2 rounded" value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <textarea className="border p-2 rounded" value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input className="border p-2 rounded" value={form.location}
        onChange={(e) => setForm({ ...form, location: e.target.value })} />
      <input className="border p-2 rounded" type="number" step="0.0001" value={form.priceEth}
        onChange={(e) => setForm({ ...form, priceEth: e.target.value })} />
      <button type="submit" className="bg-rynok-primary text-white py-2 rounded">Guardar cambios</button>
    </form>
  );
}