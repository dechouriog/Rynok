import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-rynok-primary text-white">
      <Link href="/" className="text-xl font-bold">Rynok</Link>
      <div className="flex gap-4">
        <Link href="/properties">Explorar</Link>
        <Link href="/properties/new">Publicar</Link>
      </div>
    </nav>
  );
}