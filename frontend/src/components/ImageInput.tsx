'use client';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES, imageSrc, MAX_IMAGE_BYTES, uploadImage } from '@/lib/api';

/** Imagen elegida: un archivo nuevo (se sube al guardar) o una URL ya existente. */
export type ImageValue = { file: File | null; url: string };

/** Sube el archivo si hay uno y devuelve la URL definitiva para la propiedad. */
export async function resolveImageUrl(value: ImageValue, token: string) {
  return value.file ? uploadImage(value.file, token) : value.url.trim();
}

export function ImageInput({ value, onChange }: { value: ImageValue; onChange: (value: ImageValue) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!value.file) {
      setPreview(value.url ? imageSrc(value.url) : null);
      return;
    }
    const objectUrl = URL.createObjectURL(value.file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [value.file, value.url]);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setError('Formato no soportado: usa JPG, PNG, WebP o GIF.');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError('La imagen no puede pesar más de 5 MB.');
      return;
    }
    setError(null);
    onChange({ file, url: '' });
  }

  function clear() {
    setError(null);
    onChange({ file: null, url: '' });
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <ImagePlus className="h-4 w-4" /> Imagen (opcional)
      </label>

      {preview ? (
        <div className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg bg-slate-100">
          <img src={preview} alt="Vista previa de la imagen" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={clear}
            aria-label="Quitar imagen"
            className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-slate-700 shadow hover:bg-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 flex w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 py-8 text-sm text-slate-500 hover:border-slate-400 hover:bg-slate-50"
        >
          <ImagePlus className="h-6 w-6" />
          Subir una foto desde tu computador
          <span className="text-xs text-slate-400">JPG, PNG, WebP o GIF · máx. 5 MB</span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFile}
        className="hidden"
        data-testid="image-file"
      />

      {preview && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          Cambiar foto
        </button>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
