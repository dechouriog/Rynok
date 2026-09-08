import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PropertyService } from './property.service';
import { Property } from './entities/property.entity';

const mockRepo = () => ({
  create: jest.fn(), save: jest.fn(), find: jest.fn(), findOneBy: jest.fn(), remove: jest.fn(),
});

describe('PropertyService', () => {
  let service: PropertyService;
  let repo: ReturnType<typeof mockRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [PropertyService, { provide: getRepositoryToken(Property), useFactory: mockRepo }],
    }).compile();
    service = module.get(PropertyService);
    repo = module.get(getRepositoryToken(Property));
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
    repo.findOneBy.mockResolvedValue({ id: '1', owner: { id: 'owner-1' } });
    repo.remove.mockResolvedValue(undefined);
    const result = await service.remove('1', 'owner-1');
    expect(result).toEqual({ deleted: true });
  });
});