import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectImageExtension, MAX_IMAGE_BYTES, UploadsService } from './uploads.service.js';

export const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const GIF = Buffer.from('GIF89a......', 'ascii');
const WEBP = Buffer.concat([Buffer.from('RIFF', 'ascii'), Buffer.alloc(4), Buffer.from('WEBPVP8 ', 'ascii')]);

const file = (buffer: Buffer, overrides = {}) => ({
  buffer, size: buffer.length, originalname: 'foto.png', mimetype: 'image/png', ...overrides,
});

describe('UploadsService', () => {
  let dir: string;
  let service: UploadsService;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'rynok-uploads-'));
    process.env.UPLOAD_DIR = dir;
    service = new UploadsService();
  });

  afterEach(() => {
    delete process.env.UPLOAD_DIR;
    rmSync(dir, { recursive: true, force: true });
  });

  it('detecta el tipo real por los primeros bytes', () => {
    expect(detectImageExtension(PNG)).toBe('png');
    expect(detectImageExtension(JPG)).toBe('jpg');
    expect(detectImageExtension(GIF)).toBe('gif');
    expect(detectImageExtension(WEBP)).toBe('webp');
    expect(detectImageExtension(Buffer.from('<svg onload="alert(1)"></svg>'))).toBeNull();
  });

  it('guarda la imagen con un nombre aleatorio y la extensión detectada', async () => {
    const { url } = await service.saveImage(file(PNG, { originalname: 'mi casa.php' }));

    expect(url).toMatch(/^\/uploads\/[0-9a-f-]{36}\.png$/);
    expect(existsSync(join(dir, url.replace('/uploads/', '')))).toBe(true);
  });

  it('rechaza HTML o SVG aunque digan ser imágenes', async () => {
    const html = file(Buffer.from('<html><script>alert(1)</script></html>'), { mimetype: 'image/png' });
    await expect(service.saveImage(html)).rejects.toThrow('Formato no soportado');
  });

  it('rechaza archivos de más de 5 MB y peticiones sin archivo', async () => {
    await expect(service.saveImage(file(PNG, { size: MAX_IMAGE_BYTES + 1 }))).rejects.toThrow('5 MB');
    await expect(service.saveImage(undefined)).rejects.toThrow(BadRequestException);
  });

  it('borra solo imágenes locales y nunca fuera de la carpeta', async () => {
    writeFileSync(join(dir, 'a.png'), PNG);
    const outside = join(dir, '..', `rynok-secreto-${Date.now()}.txt`);
    writeFileSync(outside, 'no borrar');

    await service.deleteIfLocal('/uploads/a.png');
    await service.deleteIfLocal(`/uploads/../${outside.split(/[\\/]/).pop()}`);
    await service.deleteIfLocal('https://images.unsplash.com/foto.jpg');
    await service.deleteIfLocal('/uploads/no-existe.png');

    expect(existsSync(join(dir, 'a.png'))).toBe(false);
    expect(existsSync(outside)).toBe(true);
    rmSync(outside);
  });
});
