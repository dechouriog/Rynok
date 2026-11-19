import { Search, ShieldCheck, PlusCircle } from 'lucide-react';
import { ButtonLink } from '@/components/ui';
import { DELIVERY_PERIOD_DAYS } from '@/lib/blockchain';

const HIGHLIGHTS = [
  'Pago en ETH desde MetaMask',
  'Fondos bloqueados en escrow',
  `Reembolso garantizado a los ${DELIVERY_PERIOD_DAYS} días`,
];

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-gradient-to-b from-brand-50 via-surface to-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-brand-200 bg-surface px-3 py-1 text-xs font-semibold text-brand-700">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> Compras protegidas por smart contract
        </p>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          Bienes raíces, comprados y vendidos en <span className="text-brand-600">cripto</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">
          Publica tu propiedad o compra la de alguien más directamente en ETH. El pago queda en escrow hasta que
          confirmas la entrega.
        </p>
        <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <ButtonLink href="/properties" size="lg" icon={<Search className="h-5 w-5" aria-hidden />}>
            Explorar propiedades
          </ButtonLink>
          <ButtonLink
            href="/properties/new"
            size="lg"
            variant="outline"
            icon={<PlusCircle className="h-5 w-5" aria-hidden />}
          >
            Publicar mi propiedad
          </ButtonLink>
        </div>
        <ul className="mx-auto mt-10 flex max-w-3xl flex-col items-center justify-center gap-x-6 gap-y-2 text-sm text-ink-muted sm:flex-row sm:flex-wrap">
          {HIGHLIGHTS.map((item) => (
            <li key={item} className="flex items-center gap-1.5 whitespace-nowrap">
              <ShieldCheck className="h-4 w-4 text-success-600" aria-hidden /> {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
