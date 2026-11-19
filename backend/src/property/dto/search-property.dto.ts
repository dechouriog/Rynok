import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNumberString, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PropertyStatus } from '../entities/property.entity.js';

export const SORT_OPTIONS = ['recent', 'price_asc', 'price_desc'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class SearchPropertyDto {
  @ApiPropertyOptional({ description: 'Búsqueda parcial en título o ubicación.', example: 'apartamento' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @ApiPropertyOptional({ description: 'Búsqueda parcial por ubicación.', example: 'Medellín' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  location?: string;

  @ApiPropertyOptional({ description: 'Precio mínimo en ETH.', example: '1' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsNumberString({}, { message: 'minPrice debe ser numérico' })
  minPrice?: string;

  @ApiPropertyOptional({ description: 'Precio máximo en ETH.', example: '5' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsNumberString({}, { message: 'maxPrice debe ser numérico' })
  maxPrice?: string;

  @ApiPropertyOptional({ enum: PropertyStatus })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ enum: SORT_OPTIONS, default: 'recent' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsIn(SORT_OPTIONS)
  sort?: SortOption;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 12, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;
}
