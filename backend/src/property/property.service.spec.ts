import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PropertyService } from './property.service.js';
import { Property } from './entities/property.entity.js';
import { UploadsService } from '../uploads/uploads.service.js';

const mockRepo = () => ({
  create: vi.fn(), save: vi.fn(async (x) => x), find: vi.fn(), findOneBy: vi.fn(), remove: vi.fn(),
  countBy: vi.fn().mockResolvedValue(0),
});

describe('PropertyService', () => {
  let service: PropertyService;
  let repo: ReturnType<typeof mockRepo>;
  let uploads: { deleteIfLocal: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PropertyService,
        { provide: getRepositoryToken(Property), useFactory: mockRepo },
        { provide: UploadsService, useValue: { deleteIfLocal: vi.fn() } },
      ],
    }).compile();
    service = module.get(PropertyService);
    repo = module.get(getRepositoryToken(Property));
    uploads = module.get(UploadsService);
  });

  it('crea una propiedad asociada al owner', async () => {
    const dto = { title: 'Casa', description: 'x', location: 'Medellín', priceEth: '1.5' };
    repo.create.mockReturnValue(dto);
    repo.save.mockResolvedValue({ id: '1', ...dto });

    const result = await service.create(dto as any, 'owner-1');
    expect(repo.create).toHaveBeenCalledWith({ ...dto, owner: { id: 'owner-1' } });
    expect(result).toEqual({ id: '1', ...dto });
  });

  it('lanza NotFoundException si la propiedad no existe', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne('x')).rejects.toThrow(NotFoundException);
  });

  it('impide editar una propiedad que no es del solicitante', async () => {
    repo.findOneBy.mockResolvedValue({ id: '1', owner: { id: 'owner-1' } });
    await expect(service.update('1', {} as any, 'owner-2')).rejects.toThrow(ForbiddenException);
  });

  it('permite eliminar solo al propietario', async () => {
    repo.findOneBy.mockResolvedValue({ id: '1', owner: { id: 'owner-1' }, status: 'AVAILABLE' });
    repo.remove.mockResolvedValue(undefined);
    const result = await service.remove('1', 'owner-1');
    expect(result).toEqual({ deleted: true });
  });

  it('impide editar o eliminar una propiedad con fondos en escrow', async () => {
    repo.findOneBy.mockResolvedValue({ id: '1', owner: { id: 'owner-1' }, status: 'IN_ESCROW' });
    await expect(service.update('1', { priceEth: '99' } as any, 'owner-1')).rejects.toThrow(ConflictException);
    await expect(service.remove('1', 'owner-1')).rejects.toThrow(ConflictException);
  });

  describe('imágenes subidas', () => {
    const owned = (imageUrl: string) => ({ id: '1', owner: { id: 'owner-1' }, status: 'AVAILABLE', imageUrl });

    it('al cambiar la imagen borra el archivo anterior', async () => {
      repo.findOneBy.mockResolvedValue(owned('/uploads/vieja.jpg'));
      await service.update('1', { imageUrl: '/uploads/nueva.jpg' } as any, 'owner-1');
      expect(uploads.deleteIfLocal).toHaveBeenCalledWith('/uploads/vieja.jpg');
    });

    it('si no cambia la imagen no borra nada', async () => {
      repo.findOneBy.mockResolvedValue(owned('/uploads/misma.jpg'));
      await service.update('1', { title: 'Nuevo título' } as any, 'owner-1');
      expect(uploads.deleteIfLocal).not.toHaveBeenCalled();
    });

    it('al eliminar la propiedad borra su imagen', async () => {
      repo.findOneBy.mockResolvedValue(owned('/uploads/casa.jpg'));
      await service.remove('1', 'owner-1');
      expect(uploads.deleteIfLocal).toHaveBeenCalledWith('/uploads/casa.jpg');
    });

    it('no borra una imagen que otra propiedad sigue usando', async () => {
      repo.findOneBy.mockResolvedValue(owned('/uploads/ajena.jpg'));
      repo.countBy.mockResolvedValue(1);
      await service.remove('1', 'owner-1');
      expect(uploads.deleteIfLocal).not.toHaveBeenCalled();
    });
  });

  it('filtra por precio mínimo aunque no haya máximo', async () => {
    repo.find.mockResolvedValue([]);
    await service.search({ minPrice: '2' });
    const { where } = repo.find.mock.calls[0][0];
    expect(where.priceEth).toBeDefined();
  });
});