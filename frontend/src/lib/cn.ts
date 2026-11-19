import { extendTailwindMerge } from 'tailwind-merge';

// Registra los tokens propios para que tailwind-merge resuelva conflictos (p. ej. rounded-card vs rounded-full).
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      radius: ['control', 'card'],
      shadow: ['card', 'raised', 'overlay'],
    },
  },
});

/** Une clases condicionales y resuelve conflictos de Tailwind (la última gana). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '));
}
