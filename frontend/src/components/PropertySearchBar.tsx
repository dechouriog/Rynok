'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function PropertySearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [location, setLocation] = useState(searchParams.get('location') ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (location) params.set('location', location);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
      <input placeholder="Buscar por título" value={q} onChange={(e) => setQ(e.target.value)}
        className="border p-2 rounded flex-1" />
      <input placeholder="Ubicación" value={location} onChange={(e) => setLocation(e.target.value)}
        className="border p-2 rounded flex-1" />
      <button type="submit" className="bg-rynok-primary text-white px-4 rounded">Buscar</button>
    </form>
  );
}