'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, type FormEvent } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { Button, Input, Select } from '@/components/ui';

export const PRICE_RANGES = [
  { label: 'Cualquier precio', min: '', max: '' },
  { label: 'Hasta 2 ETH', min: '', max: '2' },
  { label: '2 a 5 ETH', min: '2', max: '5' },
  { label: 'Más de 5 ETH', min: '5', max: '' },
];

export const SORT_OPTIONS = [
  { label: 'Más recientes', value: 'recent' },
  { label: 'Precio: menor a mayor', value: 'price_asc' },
  { label: 'Precio: mayor a menor', value: 'price_desc' },
];

const FILTER_KEYS = ['q', 'location', 'minPrice', 'maxPrice', 'sort', 'status'];

/** Filtros del marketplace. El estado vive en la URL: se puede compartir, recargar y usar atrás/adelante. */
export function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get('q') ?? '');
  const [location, setLocation] = useState(searchParams.get('location') ?? '');

  const currentRange = PRICE_RANGES.findIndex(
    (r) => r.min === (searchParams.get('minPrice') ?? '') && r.max === (searchParams.get('maxPrice') ?? ''),
  );
  const hasFilters = FILTER_KEYS.some((key) => searchParams.get(key));

  function pushParams(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => (value ? params.set(key, value) : params.delete(key)));
    params.delete('page'); // cualquier cambio de filtro vuelve a la primera página
    const qs = params.toString();
    startTransition(() => router.push(`/properties${qs ? `?${qs}` : ''}`, { scroll: false }));
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    pushParams({ q: q.trim(), location: location.trim() });
  }

  function clear() {
    setQ('');
    setLocation('');
    startTransition(() => router.push('/properties', { scroll: false }));
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Filtrar propiedades"
      aria-busy={pending}
      className="mt-6 grid gap-3 rounded-card border border-line bg-surface-muted p-4 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"
    >
      <Input
        label="Buscar"
        hideLabel
        placeholder="Buscar por título o ciudad"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        icon={<Search className="h-4 w-4" aria-hidden />}
        maxLength={100}
      />
      <Input
        label="Ubicación"
        hideLabel
        placeholder="Ubicación"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        icon={<MapPin className="h-4 w-4" aria-hidden />}
        maxLength={120}
      />
      <Select
        label="Rango de precio"
        hideLabel
        value={currentRange === -1 ? 0 : currentRange}
        onChange={(e) => {
          const range = PRICE_RANGES[Number(e.target.value)];
          pushParams({ minPrice: range.min, maxPrice: range.max });
        }}
      >
        {PRICE_RANGES.map((range, i) => (
          <option key={range.label} value={i}>
            {range.label}
          </option>
        ))}
      </Select>
      <Select
        label="Ordenar por"
        hideLabel
        value={searchParams.get('sort') ?? 'recent'}
        onChange={(e) => pushParams({ sort: e.target.value === 'recent' ? '' : e.target.value })}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <Button
          type="submit"
          loading={pending}
          icon={<Search className="h-4 w-4" aria-hidden />}
          className="flex-1 lg:flex-none"
        >
          Buscar
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={clear}
            aria-label="Limpiar filtros"
            icon={<X className="h-4 w-4" aria-hidden />}
          >
            <span className="lg:sr-only">Limpiar</span>
          </Button>
        )}
      </div>
    </form>
  );
}
