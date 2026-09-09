import { PropertyForm } from '@/components/PropertyForm';

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Publicar propiedad</h1>
      <p className="mt-1 text-slate-500">
        Completa la información y confirma con tu wallet para publicarla en el marketplace.
      </p>
      <div className="mt-8">
        <PropertyForm />
      </div>
    </div>
  );
}
