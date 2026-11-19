import type { Metadata } from 'next';
import { AlertTriangle, Code2, FileCheck2, Lock, RotateCcw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { ButtonLink, Card } from '@/components/ui';
import { CHAIN, DELIVERY_PERIOD_DAYS } from '@/lib/blockchain';

export const metadata: Metadata = {
  title: 'Cómo funciona',
  description: 'Qué es Rynok, cómo protege tu pago el contrato de escrow y cuáles son sus límites.',
};

const GUARANTEES = [
  {
    icon: Lock,
    title: 'Precio exacto',
    text: 'El contrato solo acepta un depósito igual al precio que registró el vendedor. No se puede “reservar” con 1 wei.',
  },
  {
    icon: ShieldCheck,
    title: 'Cada venta tiene su vendedor',
    text: 'Las ventas se registran por propiedad y vendedor: nadie puede listar, bloquear ni cobrar una propiedad en nombre de otro.',
  },
  {
    icon: RotateCcw,
    title: `Reembolso a los ${DELIVERY_PERIOD_DAYS} días`,
    text: 'Si el vendedor no entrega, el comprador recupera el monto completo sin depender de nadie.',
  },
  {
    icon: FileCheck2,
    title: 'Todo verificable',
    text: 'El backend solo registra una compra después de leer el evento del contrato en la blockchain.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <PageHeader
        title="Cómo funciona Rynok"
        description="Rynok es un marketplace inmobiliario descentralizado desarrollado como proyecto académico. Conecta a quien vende con quien compra y protege el pago con un smart contract de escrow."
      />

      <section className="mt-10" aria-labelledby="garantias">
        <h2 id="garantias" className="text-xl font-semibold text-ink">
          Qué garantiza el contrato
        </h2>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {GUARANTEES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Card className="h-full p-5">
                <Icon className="h-5 w-5 text-brand-600" aria-hidden />
                <h3 className="mt-3 font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="flujo">
        <h2 id="flujo" className="text-xl font-semibold text-ink">
          El flujo completo
        </h2>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-ink-soft">
          <li>Conectas MetaMask y firmas un mensaje para iniciar sesión (no cuesta gas).</li>
          <li>
            Publicas tu propiedad y pulsas <strong>Habilitar compra</strong>: queda registrada en el contrato con su
            precio.
          </li>
          <li>
            Quien compra deposita exactamente ese precio. La propiedad pasa a <strong>reservada</strong>.
          </li>
          <li>
            Al recibir la propiedad, el comprador <strong>confirma la entrega</strong> y el contrato paga al vendedor.
          </li>
          <li>
            Si no hay entrega, el vendedor puede reembolsar el dinero, o el comprador lo reclama pasados{' '}
            {DELIVERY_PERIOD_DAYS} días.
          </li>
        </ol>
      </section>

      <section className="mt-10" aria-labelledby="limites">
        <Card className="border-warning-600/30 bg-warning-50 p-5">
          <h2 id="limites" className="flex items-center gap-2 font-semibold text-warning-700">
            <AlertTriangle className="h-5 w-5" aria-hidden /> Límites conocidos
          </h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">
            <li>
              No hay sistema de disputas ni árbitro: si el vendedor entrega y el comprador no confirma, el comprador
              puede recuperar el dinero al vencer el plazo.
            </li>
            <li>
              No se verifica la titularidad legal del inmueble (KYC y registro notarial están fuera del alcance del
              MVP).
            </li>
            <li>Funciona en la red de pruebas {CHAIN.name}: el ETH no tiene valor real.</li>
          </ul>
        </Card>
      </section>

      <section className="mt-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm text-ink-muted">
          <Code2 className="h-4 w-4" aria-hidden /> Desarrollado por Diego Chourio y Leidy Obando.
        </p>
        <ButtonLink href="/properties">Explorar propiedades</ButtonLink>
      </section>
    </div>
  );
}
