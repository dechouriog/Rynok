'use client';
import { useRouter } from 'next/navigation';
import { deleteProperty } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import type { Property } from '@/lib/api';

export function PropertyOwnerActions({ property }: { property: Property }) {
  const router = useRouter();
  const { profile, token } = useWallet();

  if (!profile || profile.id !== property.owner.id) return null;

  async function handleDelete() {
    if (!token) return;
    if (!confirm('¿Eliminar esta propiedad?')) return;
    await deleteProperty(property.id, token);
    router.push('/properties');
  }

  return (
    <div className="mt-4 flex gap-3">
      <a href={`/properties/${property.id}/edit`} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
        Editar
      </a>
      <button onClick={handleDelete} className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
        Eliminar
      </button>
    </div>
  );
}