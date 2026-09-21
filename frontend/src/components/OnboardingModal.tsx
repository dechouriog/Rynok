'use client';
import { useEffect, useState } from 'react';
import { Home, Search, Wallet, ShieldCheck, X } from 'lucide-react';

const STEPS = [
  { icon: Wallet, title: 'Conecta tu wallet', text: 'Usa el botón "Conectar wallet" arriba a la derecha. Necesitas MetaMask instalado.' },
  { icon: Search, title: 'Explora propiedades', text: 'Ve a "Explorar" para ver el marketplace, buscar por ubicación y filtrar por precio.' },
  { icon: Home, title: 'Publica la tuya', text: 'Con tu wallet conectada, ve a "Publicar" para listar una propiedad con tu precio en ETH.' },
  { icon: ShieldCheck, title: 'Compra protegido', text: 'Cuando compres, tus fondos quedan retenidos en un contrato de escrow hasta confirmar la entrega.' },
];

const STORAGE_KEY = 'rynok_onboarding_seen';

export function OnboardingModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  function close() {
    localStorage.setItem(STORAGE_KEY, 'true');
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg rounded-xl bg-white p-6">
        <button onClick={close} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-bold text-slate-900">Bienvenido a Rynok</h2>
        <p className="mt-1 text-sm text-slate-500">Así funciona el marketplace, en 4 pasos:</p>
        <div className="mt-6 space-y-4">
          {STEPS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{title}</p>
                <p className="text-sm text-slate-500">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <button onClick={close} className="mt-6 w-full rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Entendido, empezar
        </button>
      </div>
    </div>
  );
}