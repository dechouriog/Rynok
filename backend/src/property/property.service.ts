import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  And,
  Between,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
  type FindOptionsOrder,
  type FindOptionsWhere,
} from 'typeorm';
import { Property, PropertyStatus } from './entities/property.entity.js';
import { CreatePropertyDto } from './dto/create-property.dto.js';
import { UpdatePropertyDto } from './dto/update-property.dto.js';
import { SearchPropertyDto, type SortOption } from './dto/search-property.dto.js';
import { UploadsService } from '../uploads/uploads.service.js';

export type Page<T> = { items: T[]; total: number; page: number; limit: number; totalPages: number };

export const DEFAULT_PAGE_SIZE = 12;

const ORDER: Record<SortOption, FindOptionsOrder<Property>> = {
  recent: { createdAt: 'DESC' },
  price_asc: { priceEth: 'ASC', createdAt: 'DESC' },
  price_desc: { priceEth: 'DESC', createdAt: 'DESC' },
};

@Injectable()
export class PropertyService {
  constructor(
    @InjectRepository(Property) private readonly repo: Repository<Property>,
    private readonly uploads: UploadsService,
  ) {}

  create(dto: CreatePropertyDto, ownerId: string) {
    const property = this.repo.create({ ...dto, imageUrl: dto.imageUrl || null, owner: { id: ownerId } });
    return this.repo.save(property);
  }

  /** Búsqueda paginada. Sin filtros devuelve todas, de la más reciente a la más antigua. */
  async search(filters: SearchPropertyDto = {}): Promise<Page<Property>> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? DEFAULT_PAGE_SIZE;

    const base: FindOptionsWhere<Property> = {};
    const locationLike = filters.location ? ILike(`%${filters.location}%`) : undefined;
    if (locationLike) base.location = locationLike;
    if (filters.status) base.status = filters.status;
    if (filters.minPrice && filters.maxPrice) base.priceEth = Between(filters.minPrice, filters.maxPrice);
    else if (filters.minPrice) base.priceEth = MoreThanOrEqual(filters.minPrice);
    else if (filters.maxPrice) base.priceEth = LessThanOrEqual(filters.maxPrice);

    // `q` busca en título o ubicación: TypeORM expresa el OR como un arreglo de condiciones.
    let where: FindOptionsWhere<Property> | FindOptionsWhere<Property>[] = base;
    if (filters.q) {
      const qLike = ILike(`%${filters.q}%`);
      where = [
        { ...base, title: qLike },
        { ...base, location: locationLike ? And(locationLike, qLike) : qLike },
      ];
    }

    const [items, total] = await this.repo.findAndCount({
      where,
      order: ORDER[filters.sort ?? 'recent'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  findByOwner(ownerId: string) {
    return this.repo.find({ where: { owner: { id: ownerId } }, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const property = await this.repo.findOneBy({ id });
    if (!property) throw new NotFoundException('La propiedad no existe');
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
    if (dto.imageUrl !== undefined) property.imageUrl = dto.imageUrl || null;
    const saved = await this.repo.save(property);
    if (dto.imageUrl !== undefined && property.imageUrl !== previousImage) {
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
