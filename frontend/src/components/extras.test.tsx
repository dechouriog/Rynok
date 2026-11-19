import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import * as api from '@/lib/api';
import { ImageInput, resolveImageUrl, type ImageValue } from './ImageInput';
import { OnboardingModal, ONBOARDING_KEY } from './OnboardingModal';
import { ResetOnboardingButton } from './ResetOnboardingButton';

vi.mock('@/lib/api', async (original) => ({
  ...(await original<typeof import('@/lib/api')>()),
  uploadImage: vi.fn(),
}));

function Harness({ initial = { file: null, url: '' } }: { initial?: ImageValue }) {
  const [value, setValue] = useState<ImageValue>(initial);
  return (
    <>
      <ImageInput value={value} onChange={setValue} />
      <output data-testid="value">{value.file ? `file:${value.file.name}` : `url:${value.url}`}</output>
    </>
  );
}

const pick = (file: File) => fireEvent.change(screen.getByTestId('image-file'), { target: { files: [file] } });

describe('ImageInput', () => {
  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
  });

  it('acepta una imagen válida y muestra la vista previa', () => {
    render(<Harness />);
    expect(screen.getByRole('button', { name: /Foto de la propiedad/ })).toBeInTheDocument();
    pick(new File(['x'], 'casa.png', { type: 'image/png' }));
    expect(screen.getByTestId('value')).toHaveTextContent('file:casa.png');
    expect(screen.getByAltText('Vista previa de la foto')).toHaveAttribute('src', 'blob:preview');
  });

  it('rechaza formatos no soportados y archivos de más de 5 MB', () => {
    render(<Harness />);
    pick(new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Formato no soportado');
    pick(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.jpg', { type: 'image/jpeg' }));
    expect(screen.getByRole('alert')).toHaveTextContent('5 MB');
    expect(screen.getByTestId('value')).toHaveTextContent('url:');
  });

  it('muestra una imagen ya subida y permite quitarla', async () => {
    render(<Harness initial={{ file: null, url: '/uploads/a.jpg' }} />);
    expect(screen.getByAltText('Vista previa de la foto')).toHaveAttribute('src', 'http://api.test/uploads/a.jpg');
    await userEvent.click(screen.getByRole('button', { name: 'Quitar foto' }));
    expect(screen.getByTestId('value')).toHaveTextContent('url:');
  });

  it('resolveImageUrl sube el archivo solo si hay uno nuevo', async () => {
    vi.mocked(api.uploadImage).mockResolvedValue('/uploads/nueva.jpg');
    const file = new File(['x'], 'a.jpg', { type: 'image/jpeg' });
    await expect(resolveImageUrl({ file, url: '' }, 't')).resolves.toBe('/uploads/nueva.jpg');
    expect(api.uploadImage).toHaveBeenCalledWith(file, 't');
    await expect(resolveImageUrl({ file: null, url: ' https://img.test/a.jpg ' }, 't')).resolves.toBe(
      'https://img.test/a.jpg',
    );
  });
});

describe('Onboarding', () => {
  beforeEach(() => window.localStorage.clear());

  it('se muestra la primera vez y no vuelve a aparecer tras cerrarlo', async () => {
    const { unmount } = render(<OnboardingModal />);
    expect(screen.getByRole('dialog', { name: 'Bienvenido a Rynok' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Entendido, empezar' }));
    expect(window.localStorage.getItem(ONBOARDING_KEY)).toBe('true');
    unmount();
    render(<OnboardingModal />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('el botón del footer reinicia la guía', async () => {
    window.localStorage.setItem(ONBOARDING_KEY, 'true');
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, configurable: true });
    render(<ResetOnboardingButton />);
    await userEvent.click(screen.getByRole('button', { name: 'Ver guía de inicio' }));
    expect(window.localStorage.getItem(ONBOARDING_KEY)).toBeNull();
    expect(reload).toHaveBeenCalled();
  });
});
