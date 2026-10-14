import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { Property, PropertyStatus } from './entities/property.entity.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { SearchPropertyDto } from './dto/search-property.dto.js';
import { UploadsService } from '../uploads/uploads.service.js';

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property) private readonly repo: Repository<Property>,
    private readonly uploads: UploadsService,
  ) {}

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
    } else if (filters.minPrice) {
      where.priceEth = MoreThanOrEqual(filters.minPrice);
    } else if (filters.maxPrice) {
      where.priceEth = LessThanOrEqual(filters.maxPrice);
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
    if (property.status !== PropertyStatus.AVAILABLE) {
      throw new ConflictException('No se puede editar una propiedad en escrow o vendida');
    }
    const previousImage = property.imageUrl;
    Object.assign(property, dto);
    const saved = await this.repo.save(property);
    if (dto.imageUrl !== undefined && dto.imageUrl !== previousImage) {
      await this.releaseImage(previousImage);
    }
    return saved;
  }

  /** Borra el archivo de una imagen subida, salvo que otra propiedad todavía la use. */
  private async releaseImage(url?: string | null) {
    if (!url || (await this.repo.countBy({ imageUrl: url })) > 0) return;
    await this.uploads.deleteIfLocal(url);
  }

  async remove(id: string, requesterId: string) {
    const property = await this.findOne(id);
    if (property.owner.id !== requesterId) {
      throw new ForbiddenException('Solo el propietario puede eliminar esta propiedad');
    }
    if (property.status === PropertyStatus.IN_ESCROW) {
      throw new ConflictException('No se puede eliminar una propiedad con fondos en escrow');
    }
    const image = property.imageUrl;
    await this.repo.remove(property);
    await this.releaseImage(image);
    return { deleted: true };
  }
}
