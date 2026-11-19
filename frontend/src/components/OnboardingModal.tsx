'use client';
import { useState, useSyncExternalStore } from 'react';
import { Home, Search, ShieldCheck, Wallet } from 'lucide-react';
import { Button, Modal } from '@/components/ui';

const STEPS = [
  {
    icon: Wallet,
    title: 'Conecta tu wallet',
    text: 'Usa "Conectar wallet" arriba a la derecha. Necesitas MetaMask instalado.',
  },
  {
    icon: Search,
    title: 'Explora propiedades',
    text: 'En "Explorar" buscas por ciudad, filtras por precio y ordenas los resultados.',
  },
  {
    icon: Home,
    title: 'Publica la tuya',
    text: 'Con tu wallet conectada, en "Publicar" listas una propiedad con tu precio en ETH.',
  },
  {
    icon: ShieldCheck,
    title: 'Compra protegido',
    text: 'Tus fondos quedan retenidos en un contrato de escrow hasta que confirmas la entrega.',
  },
];

export const ONBOARDING_KEY = 'rynok_onboarding_seen';

function readSeen(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) === 'true';
  } catch {
    return true; // sin localStorage no molestamos en cada visita
  }
}

const noopSubscribe = () => () => undefined;

/** Guía de bienvenida que se muestra una sola vez por navegador. */
export function OnboardingModal() {
  // En el servidor se considera vista: evita parpadeos y desajustes de hidratación.
  const seen = useSyncExternalStore(noopSubscribe, readSeen, () => true);
  const [dismissed, setDismissed] = useState(false);

  function close() {
    try {
      window.localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // Si no se puede guardar, igual se cierra.
    }
    setDismissed(true);
  }

  return (
    <Modal
      open={!seen && !dismissed}
      onClose={close}
      title="Bienvenido a Rynok"
      description="Así funciona el marketplace, en 4 pasos:"
      footer={
        <Button onClick={close} fullWidth>
          Entendido, empezar
        </Button>
      }
    >
      <ol className="space-y-4">
        {STEPS.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand-600"
              aria-hidden
            >
              <Icon className="h-4 w-4" />
            </span>
            <div>
              <p className="font-medium text-ink">{title}</p>
              <p className="text-sm text-ink-muted">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Modal>
  );
}
