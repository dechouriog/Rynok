import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class SearchPropertyDto {
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsNumberString() minPrice?: string;
  @IsOptional() @IsNumberString() maxPrice?: string;
}