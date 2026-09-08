import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Property } from './entities/property.entity';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertyService {
  constructor(@InjectRepository(Property) private readonly repo: Repository<Property>) {}

  create(dto: CreatePropertyDto, ownerId: string) {
    const property = this.repo.create({ ...dto, owner: { id: ownerId } as any });
    return this.repo.save(property);
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const property = await this.repo.findOneBy({ id });
    if (!property) throw new NotFoundException(`Property ${id} not found`);
    return property;
  }

  async update(id: string, dto: UpdatePropertyDto, requesterId: string) {
    const property = await this.findOne(id);
    if (property.owner.id !== requesterId) {
      throw new ForbiddenException('Solo el propietario puede editar esta propiedad');
    }
    Object.assign(property, dto);
    return this.repo.save(property);
  }

  async remove(id: string, requesterId: string) {
    const property = await this.findOne(id);
    if (property.owner.id !== requesterId) {
      throw new ForbiddenException('Solo el propietario puede eliminar esta propiedad');
    }
    await this.repo.remove(property);
    return { deleted: true };
  }
}