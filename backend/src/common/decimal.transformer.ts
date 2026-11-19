import type { ValueTransformer } from 'typeorm';

/**
 * Normaliza columnas decimal a string sin ceros sobrantes ("1.500000" → "1.5").
 * Postgres devuelve string y SQLite número; así la API responde siempre igual.
 */
export const decimalTransformer: ValueTransformer = {
  to: (value?: string | null) => value,
  from: (value?: string | number | null) => {
    if (value === null || value === undefined) return value;
    const text = String(value);
    return text.includes('.') ? text.replace(/0+$/, '').replace(/\.$/, '') : text;
  },
};
