import { IsNumberString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePropertyDto {
  @IsString() @MaxLength(120) title: string;
  @IsString() description: string;
  @IsString() location: string;
  @IsNumberString() priceEth: string;
  @IsOptional() @IsString() imageUrl?: string;
}