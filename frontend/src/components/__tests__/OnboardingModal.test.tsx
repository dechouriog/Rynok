import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingModal } from '../OnboardingModal';

describe('OnboardingModal', () => {
  beforeEach(() => localStorage.clear());

  it('se muestra la primera vez', () => {
    render(<OnboardingModal />);
    expect(screen.getByText('Bienvenido a Rynok')).toBeInTheDocument();
  });

  it('no se muestra si ya se marcó como visto', () => {
    localStorage.setItem('rynok_onboarding_seen', 'true');
    render(<OnboardingModal />);
    expect(screen.queryByText('Bienvenido a Rynok')).not.toBeInTheDocument();
  });

  it('se cierra y marca el flag al hacer clic en "Entendido"', () => {
    render(<OnboardingModal />);
    fireEvent.click(screen.getByText('Entendido, empezar'));
    expect(localStorage.getItem('rynok_onboarding_seen')).toBe('true');
  });
});