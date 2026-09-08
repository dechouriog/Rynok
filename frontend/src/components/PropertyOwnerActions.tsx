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
    <div className="flex gap-3 mt-4">
      <a href={`/properties/${property.id}/edit`} className="border px-3 py-1.5 rounded text-sm">Editar</a>
      <button onClick={handleDelete} className="border border-red-400 text-red-500 px-3 py-1.5 rounded text-sm">
        Eliminar
      </button>
    </div>
  );
}