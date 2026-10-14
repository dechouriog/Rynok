import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ImageInput, resolveImageUrl, type ImageValue } from '../ImageInput';
import * as api from '@/lib/api';

vi.mock('@/lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/api')>();
  return { ...actual, uploadImage: vi.fn() };
});

beforeEach(() => {
  vi.mocked(api.uploadImage).mockReset();
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
});

function Harness({ initial = { file: null, url: '' } }: { initial?: ImageValue }) {
  const [value, setValue] = useState<ImageValue>(initial);
  return (
    <>
      <ImageInput value={value} onChange={setValue} />
      <span data-testid="state">{value.file ? `file:${value.file.name}` : `url:${value.url}`}</span>
    </>
  );
}

const pick = (file: File) => fireEvent.change(screen.getByTestId('image-file'), { target: { files: [file] } });
const png = (bytes = 10) => new File([new Uint8Array(bytes)], 'casa.png', { type: 'image/png' });

describe('ImageInput', () => {
  it('muestra la vista previa del archivo elegido', () => {
    render(<Harness />);
    pick(png());

    expect(screen.getByTestId('state')).toHaveTextContent('file:casa.png');
    expect(screen.getByAltText('Vista previa de la imagen')).toHaveAttribute('src', 'blob:preview');
  });

  it('rechaza formatos que no son imagen', () => {
    render(<Harness />);
    pick(new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' }));

    expect(screen.getByText('Formato no soportado: usa JPG, PNG, WebP o GIF.')).toBeInTheDocument();
    expect(screen.getByTestId('state')).toHaveTextContent('url:');
  });

  it('rechaza imágenes de más de 5 MB', () => {
    render(<Harness />);
    pick(png(api.MAX_IMAGE_BYTES + 1));

    expect(screen.getByText('La imagen no puede pesar más de 5 MB.')).toBeInTheDocument();
  });

  it('muestra la imagen actual de la propiedad y permite quitarla', () => {
    render(<Harness initial={{ file: null, url: '/uploads/actual.jpg' }} />);

    expect(screen.getByAltText('Vista previa de la imagen')).toHaveAttribute(
      'src',
      expect.stringMatching(/\/uploads\/actual\.jpg$/),
    );

    fireEvent.click(screen.getByLabelText('Quitar imagen'));
    expect(screen.queryByAltText('Vista previa de la imagen')).not.toBeInTheDocument();
    expect(screen.getByTestId('state')).toHaveTextContent('url:');
  });

  it('no ofrece pegar una URL: la imagen solo se sube como archivo', () => {
    render(<Harness />);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

describe('resolveImageUrl', () => {
  it('sube el archivo y devuelve la URL del backend', async () => {
    vi.mocked(api.uploadImage).mockResolvedValue('/uploads/nueva.png');
    const file = png();

    await expect(resolveImageUrl({ file, url: '' }, 'jwt')).resolves.toBe('/uploads/nueva.png');
    expect(api.uploadImage).toHaveBeenCalledWith(file, 'jwt');
  });

  it('sin archivo nuevo conserva la imagen actual, sin subir nada', async () => {
    await expect(resolveImageUrl({ file: null, url: '/uploads/actual.jpg' }, 'jwt')).resolves.toBe('/uploads/actual.jpg');
    expect(api.uploadImage).not.toHaveBeenCalled();
  });
});
