'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin } from 'lucide-react';
import { ApiError, createProperty, updateProperty, type Property } from '@/lib/api';
import { useWallet } from '@/context/WalletContext';
import {
  EMPTY_PROPERTY,
  toPropertyInput,
  validateProperty,
  type PropertyFormErrors,
  type PropertyFormValues,
} from '@/lib/validation';
import { Button, ButtonLink, Input, Textarea, useToast } from '@/components/ui';
import { ImageInput, resolveImageUrl, type ImageValue } from './ImageInput';

type PropertyFormProps = { property?: Property };

const FIELD_ORDER: Array<keyof PropertyFormValues> = ['title', 'description', 'location', 'priceEth'];

/**
 * Formulario de publicación y edición. Valida en el cliente con las mismas reglas que el servidor,
 * sube la foto (si se eligió una) al guardar y renueva la sesión si el JWT expiró.
 */
export function PropertyForm({ property }: PropertyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { withSession } = useWallet();
  const editing = Boolean(property);
  const [values, setValues] = useState<PropertyFormValues>(
    property
      ? {
          title: property.title,
          description: property.description,
          location: property.location,
          priceEth: property.priceEth,
        }
      : EMPTY_PROPERTY,
  );
  const [image, setImage] = useState<ImageValue>({ file: null, url: property?.imageUrl ?? '' });
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update(field: keyof PropertyFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const found = validateProperty(values);
    setErrors(found);
    if (Object.keys(found).length) {
      // Lleva el foco al primer campo con error (por nombre: el DOM aún no tiene aria-invalid en este punto).
      const first = FIELD_ORDER.find((field) => found[field]);
      const element = first ? event.currentTarget.elements.namedItem(first) : null;
      if (element instanceof HTMLElement) element.focus();
      return;
    }

    setSubmitting(true);
    try {
      const saved = await withSession(async (token) => {
        const input = toPropertyInput(values, await resolveImageUrl(image, token));
        return property ? updateProperty(property.id, input, token) : createProperty(input, token);
      });
      const priceChanged = property && Number(saved.priceEth) !== Number(property.priceEth);
      toast({
        tone: 'success',
        title: editing ? 'Cambios guardados' : 'Propiedad publicada',
        description: priceChanged
          ? 'Cambiaste el precio: pulsa "Actualizar precio on-chain" para que puedan comprarla.'
          : editing
            ? undefined
            : 'Siguiente paso: habilita la compra para que puedan pagarte en ETH.',
      });
      router.push(`/properties/${saved.id}`);
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.details.length > 1
            ? error.details.join(' · ')
            : error.message
          : 'No se pudo guardar la propiedad. Inténtalo de nuevo.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Input
        label="Título"
        required
        placeholder="Apartamento moderno en El Poblado"
        name="title"
        value={values.title}
        maxLength={120}
        onChange={(e) => update('title', e.target.value)}
        error={errors.title}
        hint="Entre 5 y 120 caracteres."
      />
      <Textarea
        label="Descripción"
        required
        placeholder="Habitaciones, baños, amenidades y estado de la propiedad."
        name="description"
        value={values.description}
        maxLength={2000}
        onChange={(e) => update('description', e.target.value)}
        error={errors.description}
        hint={`${values.description.trim().length}/2000 caracteres (mínimo 20).`}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Ubicación"
          required
          placeholder="Medellín, Antioquia"
          name="location"
          value={values.location}
          maxLength={120}
          onChange={(e) => update('location', e.target.value)}
          error={errors.location}
          icon={<MapPin className="h-4 w-4 text-ink-muted" aria-hidden />}
        />
        <Input
          label="Precio en ETH"
          required
          inputMode="decimal"
          placeholder="2.5"
          name="priceEth"
          value={values.priceEth}
          onChange={(e) => update('priceEth', e.target.value)}
          error={errors.priceEth}
          hint="Hasta 6 decimales. Es el monto exacto que el comprador depositará."
        />
      </div>
      <ImageInput value={image} onChange={setImage} />

      {formError && (
        <p
          role="alert"
          className="rounded-control border border-danger-600/30 bg-danger-50 px-4 py-3 text-sm text-danger-700"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <ButtonLink href={property ? `/properties/${property.id}` : '/properties'} variant="outline">
          Cancelar
        </ButtonLink>
        <Button type="submit" loading={submitting} loadingText={editing ? 'Guardando…' : 'Publicando…'}>
          {editing ? 'Guardar cambios' : 'Publicar propiedad'}
        </Button>
      </div>
    </form>
  );
}
