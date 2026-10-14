'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const PRICE_RANGES = [
  { label: 'Cualquier precio', min: '', max: '' },
  { label: 'Hasta 2 ETH', min: '', max: '2' },
  { label: '2 - 5 ETH', min: '2', max: '5' },
  { label: '5+ ETH', min: '5', max: '' },
];

const SORT_OPTIONS = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Precio: menor a mayor', value: 'price_asc' },
  { label: 'Precio: mayor a menor', value: 'price_desc' },
];

export function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [location, setLocation] = useState(searchParams.get('location') ?? '');

  // Los selects se derivan de la URL para reflejar el filtro activo al recargar o navegar.
  const priceIndex = Math.max(
    0,
    PRICE_RANGES.findIndex(
      (range) =>
        range.min === (searchParams.get('minPrice') ?? '') &&
        range.max === (searchParams.get('maxPrice') ?? ''),
    ),
  );
  const sort = searchParams.get('sort') ?? 'recent';

  function pushParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    router.push(`/properties?${params.toString()}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    pushParams({ q, location });
  }

  function handlePriceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const range = PRICE_RANGES[Number(e.target.value)];
    pushParams({ minPrice: range.min, maxPrice: range.max });
  }

  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    pushParams({ sort: e.target.value });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-wrap gap-3">
      <input
        placeholder="Buscar por título"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <input
        placeholder="Ubicación"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
      />
      <select
        aria-label="Rango de precio"
        value={priceIndex}
        onChange={handlePriceChange}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
      >
        {PRICE_RANGES.map((range, i) => (
          <option key={range.label} value={i}>{range.label}</option>
        ))}
      </select>
      <select
        aria-label="Ordenar"
        value={sort}
        onChange={handleSortChange}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button type="submit" className="rounded-lg bg-slate-900 px-6 py-2 text-sm font-semibold text-white hover:bg-slate-800">
        Buscar
      </button>
    </form>
  );
}
