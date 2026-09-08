import { Between, ILike } from 'typeorm';
import { SearchPropertyDto } from './dto/search-property.dto';

// dentro de la clase PropertyService:
search(filters: SearchPropertyDto) {
  const where: any = {};
  if (filters.q) where.title = ILike(`%${filters.q}%`);
  if (filters.location) where.location = ILike(`%${filters.location}%`);
  if (filters.minPrice && filters.maxPrice) {
    where.priceEth = Between(filters.minPrice, filters.maxPrice);
  }
  return this.repo.find({ where, order: { createdAt: 'DESC' } });
}