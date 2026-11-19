'use client';
import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { imageSrc } from '@/lib/api';

const FALLBACK = '/placeholder-property.svg';

type PropertyImageProps = {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
};

/**
 * Imagen de propiedad con next/image (carga diferida, tamaños responsivos, sin saltos de layout:
 * ocupa el contenedor con `fill`). Las URLs externas las escribe el vendedor, así que no pasan por
 * el optimizador del servidor (evita que Rynok descargue hosts arbitrarios) y, si fallan, se muestra
 * una ilustración local.
 */
export function PropertyImage({ src, alt, sizes, priority, className }: PropertyImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolved = imageSrc(src);
  const source = resolved && resolved !== failedSrc ? resolved : FALLBACK;
  const external = /^https?:\/\//.test(source);

  return (
    <Image
      src={source}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      unoptimized={external || source.endsWith('.svg')}
      onError={() => resolved && setFailedSrc(resolved)}
      className={cn('object-cover', className)}
    />
  );
}
