import { CheckCircle2, Search, ShieldCheck, Wallet, type LucideIcon } from 'lucide-react';

const STEPS: Array<{ icon: LucideIcon; title: string; text: string }> = [
  {
    icon: Search,
    title: 'Encuentra tu propiedad',
    text: 'Filtra por ciudad y precio en ETH. Solo las propiedades con compra habilitada aceptan pagos.',
  },
  {
    icon: Wallet,
    title: 'Paga con MetaMask',
    text: 'Depositas el precio exacto en el contrato. El vendedor todavía no recibe el dinero.',
  },
  {
    icon: ShieldCheck,
    title: 'El escrow lo protege',
    text: 'Los fondos quedan bloqueados. Si no hay entrega, recuperas tu dinero pasados 30 días.',
  },
  {
    icon: CheckCircle2,
    title: 'Confirmas la entrega',
    text: 'Cuando recibes la propiedad, liberas el pago al vendedor con un clic.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-t border-line bg-surface-muted py-16 sm:py-20" aria-labelledby="como-funciona">
      <div className="mx-auto max-w-6xl px-4">
        <h2 id="como-funciona" className="text-center text-2xl font-bold tracking-tight text-ink">
          Cómo funciona
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-ink-muted">
          Cuatro pasos, sin intermediarios que retengan tu dinero.
        </p>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }, i) => (
            <li key={title} className="rounded-card border border-line bg-surface p-6 shadow-card">
              <div className="flex items-center gap-3">
                <span
                  className="flex h-11 w-11 items-center justify-center rounded-control bg-brand-50 text-brand-600"
                  aria-hidden
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-semibold text-ink-muted">Paso {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
