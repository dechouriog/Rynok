'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatEth, getProperty, updateProperty, type Property } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import { ImageInput, resolveImageUrl, type ImageValue } from '@/components/ImageInput';

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500';

export default function EditPropertyPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { token, profile } = useWallet();
  const [form, setForm] = useState({ title: '', description: '', location: '', priceEth: '' });
  const [image, setImage] = useState<ImageValue>({ file: null, url: '' });
  const [property, setProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getProperty(id)
      .then((p) => {
        setProperty(p);
        setForm({
          title: p.title,
          description: p.description,
          location: p.location,
          priceEth: formatEth(p.priceEth),
        });
        setImage({ file: null, url: p.imageUrl ?? '' });
      })
      .catch(() => setError('Propiedad no encontrada.'));
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('Conecta tu wallet para editar.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const imageUrl = await resolveImageUrl(image, token);
      await updateProperty(id, { ...form, imageUrl }, token);
      router.push(`/properties/${id}`);
    } catch (err: any) {
      setError(err?.message ?? 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  const isOwner = Boolean(profile && property && profile.id === property.owner.id);
  const locked = (property?.status ?? 'AVAILABLE') !== 'AVAILABLE';

  if (property && (!isOwner || locked)) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-slate-900">Editar propiedad</h1>
        <p className="mt-6 text-slate-600">
          {!isOwner
            ? 'Solo el propietario puede editar esta propiedad.'
            : 'No se puede editar una propiedad en escrow o vendida.'}
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Editar propiedad</h1>
      <p className="mt-1 text-sm text-slate-500">
        Si cambias el precio, después tendrás que pulsar “Actualizar precio on-chain” en el detalle de la propiedad.
      </p>
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
        <ImageInput value={image} onChange={setImage} />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}
