import { IsOptional, IsString } from 'class-validator';

export class CreateListingDto {
  @IsString()
  id!: string;

  @IsString()
  ownerId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  priceAmount!: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  propertyType?: string;
}
