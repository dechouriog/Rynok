import type { Metadata } from 'next';
import { PageHeader } from '@/components/PageHeader';
import { PropertyForm } from '@/components/PropertyForm';
import { RequireWallet } from '@/components/RequireWallet';
import { Card } from '@/components/ui';

export const metadata: Metadata = { title: 'Publicar propiedad' };

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader
        title="Publicar propiedad"
        description="Completa la información. Después de publicar podrás habilitar la compra en el contrato de escrow."
      />
      <div className="mt-8">
        <RequireWallet
          title="Conecta tu wallet para publicar"
          description="La propiedad quedará asociada a tu wallet: solo tú podrás editarla y recibir el pago."
        >
          <Card className="p-5 sm:p-8">
            <PropertyForm />
          </Card>
        </RequireWallet>
      </div>
    </div>
  );
}
