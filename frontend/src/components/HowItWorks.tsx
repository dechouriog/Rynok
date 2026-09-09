import { Home, Search, Wallet, ShieldCheck } from 'lucide-react';

const STEPS = [
  { icon: Home, title: 'Publica tu propiedad', text: 'Sube fotos, descripción, ubicación y define tu precio en ETH.' },
  { icon: Search, title: 'Explora el marketplace', text: 'Los compradores filtran por ciudad y precio.' },
  { icon: Wallet, title: 'Paga con MetaMask', text: 'La compra se firma directamente desde la wallet del comprador.' },
  { icon: ShieldCheck, title: 'Escrow protege el pago', text: 'Los fondos se liberan solo cuando la venta se confirma.' },
];

export function HowItWorks() {
  return (
    <div className="border-t border-slate-200 bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-2xl font-bold text-slate-900">Cómo funciona</h2>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
