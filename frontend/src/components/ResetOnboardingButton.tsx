'use client';

export function ResetOnboardingButton() {
  return (
    <button
      onClick={() => {
        localStorage.removeItem('rynok_onboarding_seen');
        window.location.reload();
      }}
      className="hover:text-slate-900"
    >
      Ver guía de inicio
    </button>
  );
}
