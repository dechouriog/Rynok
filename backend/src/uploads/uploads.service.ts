import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const UPLOADS_URL_PREFIX = '/uploads/';

/** Carpeta donde se guardan las imágenes subidas (UPLOAD_DIR, por defecto backend/uploads). */
export function uploadDir() {
  return resolve(process.env.UPLOAD_DIR || 'uploads');
}

/** Archivo recibido por multer (memoryStorage). */
export type UploadedImage = { buffer: Buffer; size: number; originalname: string; mimetype: string };

// El tipo se detecta por los primeros bytes del archivo, no por la extensión ni
// por el Content-Type que manda el cliente: así no se puede subir HTML o SVG
// (con scripts) disfrazado de imagen.
const SIGNATURES: Array<{ ext: string; matches: (b: Buffer) => boolean }> = [
  { ext: 'jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', matches: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'gif', matches: (b) => ['GIF87a', 'GIF89a'].includes(b.subarray(0, 6).toString('ascii')) },
  {
    ext: 'webp',
    matches: (b) => b.subarray(0, 4).toString('ascii') === 'RIFF' && b.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

export function detectImageExtension(buffer: Buffer) {
  return SIGNATURES.find((s) => s.matches(buffer))?.ext ?? null;
}

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  async saveImage(file: UploadedImage | undefined) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Adjunta una imagen en el campo "file"');
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('La imagen no puede pesar más de 5 MB');
    }
    const ext = detectImageExtension(file.buffer);
    if (!ext) {
      throw new BadRequestException('Formato no soportado: usa JPG, PNG, WebP o GIF');
    }

    const filename = `${randomUUID()}.${ext}`;
    await mkdir(uploadDir(), { recursive: true });
    await writeFile(join(uploadDir(), filename), file.buffer);
    return { url: `${UPLOADS_URL_PREFIX}${filename}` };
  }

  /** Borra una imagen subida a Rynok; las URLs externas se ignoran. */
  async deleteIfLocal(url?: string | null) {
    if (!url?.startsWith(UPLOADS_URL_PREFIX)) return;
    // basename evita salir de la carpeta (p. ej. "/uploads/../.env").
    const filename = basename(url);
    try {
      await unlink(join(uploadDir(), filename));
    } catch (err: any) {
      if (err?.code !== 'ENOENT') this.logger.warn(`No se pudo borrar ${filename}: ${err?.message}`);
    }
  }
}
