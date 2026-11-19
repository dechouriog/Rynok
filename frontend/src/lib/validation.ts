import type { PropertyInput } from './api';

/** Mismas reglas que backend/src/property/dto/create-property.dto.ts. */
export const PRICE_ETH_PATTERN = /^(?!0+(\.0+)?$)\d{1,7}(\.\d{1,6})?$/;

export type PropertyFormValues = { title: string; description: string; location: string; priceEth: string };
export type PropertyFormErrors = Partial<Record<keyof PropertyFormValues, string>>;

export const EMPTY_PROPERTY: PropertyFormValues = { title: '', description: '', location: '', priceEth: '' };

export function validateProperty(values: PropertyFormValues): PropertyFormErrors {
  const errors: PropertyFormErrors = {};
  const title = values.title.trim();
  const description = values.description.trim();
  const location = values.location.trim();
  const price = values.priceEth.trim().replace(',', '.');

  if (title.length < 5) errors.title = 'El título debe tener al menos 5 caracteres.';
  else if (title.length > 120) errors.title = 'El título no puede superar 120 caracteres.';

  if (description.length < 20) errors.description = 'Describe la propiedad con al menos 20 caracteres.';
  else if (description.length > 2000) errors.description = 'La descripción no puede superar 2000 caracteres.';

  if (!location) errors.location = 'Indica la ubicación de la propiedad.';
  else if (location.length > 120) errors.location = 'La ubicación no puede superar 120 caracteres.';

  if (!price) errors.priceEth = 'Indica el precio en ETH.';
  else if (!PRICE_ETH_PATTERN.test(price)) {
    errors.priceEth = 'Usa un número mayor que 0 con hasta 6 decimales (por ejemplo 2.5).';
  }
  return errors;
}

/** Normaliza los valores del formulario al cuerpo que espera la API. */
export function toPropertyInput(values: PropertyFormValues, imageUrl: string): PropertyInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    location: values.location.trim(),
    priceEth: values.priceEth.trim().replace(',', '.'),
    imageUrl,
  };
}
