import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, Repository } from 'typeorm';
import { Property } from './entities/property.entity.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { SearchPropertyDto } from './dto/search-property.dto.js';

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

  search(filters: SearchPropertyDto) {
    const where: any = {};
    if (filters.q) where.title = ILike(`%${filters.q}%`);
    if (filters.location) where.location = ILike(`%${filters.location}%`);
    if (filters.minPrice && filters.maxPrice) {
      where.priceEth = Between(filters.minPrice, filters.maxPrice);
    }
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
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