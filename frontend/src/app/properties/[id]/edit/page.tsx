import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getProperty } from '@/lib/api';
import { PageHeader } from '@/components/PageHeader';
import { RequireWallet } from '@/components/RequireWallet';
import { EditGuard } from './EditGuard';

export const metadata: Metadata = { title: 'Editar propiedad' };

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="Editar propiedad" description={property.title} />
      <div className="mt-8">
        <RequireWallet
          title="Conecta tu wallet para editar"
          description="Solo la wallet que publicó la propiedad puede editarla."
        >
          <EditGuard property={property} />
        </RequireWallet>
      </div>
    </div>
  );
}
