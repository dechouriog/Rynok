'use client';
import { Lock } from 'lucide-react';
import type { Property } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import { ButtonLink, Card, EmptyState } from '@/components/ui';
import { PropertyForm } from '@/components/PropertyForm';

/** Solo el dueño edita, y solo mientras la propiedad está disponible (el backend aplica las mismas reglas). */
export function EditGuard({ property }: { property: Property }) {
  const { address } = useWallet();
  const back = (
    <ButtonLink href={`/properties/${property.id}`} variant="outline">
      Volver a la propiedad
    </ButtonLink>
  );

  if (address !== property.owner.walletAddress.toLowerCase()) {
    return (
      <EmptyState
        icon={<Lock />}
        title="No puedes editar esta propiedad"
        description="Solo la wallet que la publicó puede modificarla."
        action={back}
      />
    );
  }
  if (property.status !== 'AVAILABLE') {
    return (
      <EmptyState
        icon={<Lock />}
        title="Esta propiedad ya no se puede editar"
        description="Tiene una compra en curso o ya se vendió."
        action={back}
      />
    );
  }
  return (
    <Card className="p-5 sm:p-8">
      <p className="mb-5 rounded-control bg-brand-50 p-3 text-sm text-brand-800">
        Si cambias el precio, tendrás que pulsar &quot;Actualizar precio on-chain&quot; en el detalle para registrar el
        nuevo monto en el contrato. Mientras tanto, nadie podrá comprarla.
      </p>
      <PropertyForm property={property} />
    </Card>
  );
}
