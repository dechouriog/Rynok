import Link from 'next/link';
import { Home } from 'lucide-react';

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 rounded-control text-lg font-extrabold tracking-tight text-ink"
      aria-label="Rynok, inicio"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-control bg-brand-600 text-white shadow-card">
        <Home className="h-4 w-4" aria-hidden />
      </span>
      <span>
        Ryn<span className="text-brand-600">ok</span>
      </span>
    </Link>
  );
}
