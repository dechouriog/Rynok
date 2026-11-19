'use client';
import { ONBOARDING_KEY } from './OnboardingModal';

/** Vuelve a mostrar la guía de inicio. */
export function ResetOnboardingButton() {
  return (
    <button
      type="button"
      onClick={() => {
        try {
          window.localStorage.removeItem(ONBOARDING_KEY);
        } catch {
          // sin localStorage no hay nada que reiniciar
        }
        window.location.reload();
      }}
      className="rounded-control text-ink-muted hover:text-ink"
    >
      Ver guía de inicio
    </button>
  );
}
