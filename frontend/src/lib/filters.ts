import type { PropertyFilters as Filters, SortOption } from './api';

const SORTS: SortOption[] = ['recent', 'price_asc', 'price_desc'];

export type SearchParams = Record<string, string | string[] | undefined>;

/** Toma solo los parámetros conocidos y descarta valores inválidos antes de llamar a la API. */
export function parseFilters(raw: SearchParams): Filters & { page: number } {
  const one = (key: string) => {
    const value = raw[key];
    return (Array.isArray(value) ? value[0] : value)?.trim() || undefined;
  };
  const numeric = (key: string) => {
    const value = one(key);
    return value && /^\d+(\.\d+)?$/.test(value) ? value : undefined;
  };
  const sort = one('sort') as SortOption | undefined;
  const page = Number.parseInt(one('page') ?? '1', 10);
  return {
    q: one('q'),
    location: one('location'),
    minPrice: numeric('minPrice'),
    maxPrice: numeric('maxPrice'),
    sort: sort && SORTS.includes(sort) ? sort : undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}
