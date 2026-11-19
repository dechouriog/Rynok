'use client';
import Image from 'next/image';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, ImagePlus, RefreshCw, X } from 'lucide-react';
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_BYTES, imageSrc, uploadImage } from '@/lib/api';
import { Button } from '@/components/ui';

/** Imagen elegida: un archivo nuevo (se sube al guardar) o una URL ya existente. */
export type ImageValue = { file: File | null; url: string };

/** Sube el archivo si hay uno y devuelve la URL definitiva para la propiedad. */
export async function resolveImageUrl(value: ImageValue, token: string) {
  return value.file ? uploadImage(value.file, token) : value.url.trim();
}

/** Vista previa: URL temporal del archivo elegido (se libera al cambiarlo) o imagen ya guardada. */
function usePreview(value: ImageValue) {
  const objectUrl = useMemo(() => (value.file ? URL.createObjectURL(value.file) : null), [value.file]);
  useEffect(
    () => () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    },
    [objectUrl],
  );
  return objectUrl ?? (value.url ? imageSrc(value.url) : null);
}

export function ImageInput({ value, onChange }: { value: ImageValue; onChange: (value: ImageValue) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const labelId = useId();
  const errorId = useId();
  const [error, setError] = useState<string | null>(null);
  const preview = usePreview(value);

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
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
    <div className="space-y-1.5">
      <p id={labelId} className="flex items-center gap-1.5 text-sm font-medium text-ink">
        <ImagePlus className="h-4 w-4 text-ink-muted" aria-hidden /> Foto de la propiedad (opcional)
      </p>

      {preview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-control bg-surface-sunken">
          <Image
            src={preview}
            alt="Vista previa de la foto"
            fill
            unoptimized
            sizes="(min-width: 768px) 640px, 100vw"
            className="object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              icon={<RefreshCw className="h-4 w-4" aria-hidden />}
            >
              Cambiar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clear}
              aria-label="Quitar foto"
              icon={<X className="h-4 w-4" aria-hidden />}
            />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-labelledby={labelId}
          aria-describedby={error ? errorId : undefined}
          className="flex w-full flex-col items-center justify-center gap-1 rounded-control border-2 border-dashed border-line-strong bg-surface-muted py-8 text-sm text-ink-soft transition-colors hover:border-brand-400 hover:bg-brand-50"
        >
          <ImagePlus className="h-6 w-6 text-brand-600" aria-hidden />
          <span className="font-medium">Subir una foto desde tu computador</span>
          <span className="text-xs text-ink-muted">JPG, PNG, WebP o GIF · máx. 5 MB</span>
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(',')}
        onChange={handleFile}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        data-testid="image-file"
      />

      {error && (
        <p id={errorId} role="alert" className="flex items-center gap-1 text-xs font-medium text-danger-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {error}
        </p>
      )}
    </div>
  );
}
