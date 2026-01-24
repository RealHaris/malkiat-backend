import { IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateListingDto {
  @ApiProperty({ description: "Listing ID" })
  @IsString()
  id!: string;

  @ApiProperty({ description: "Owner user ID" })
  @IsString()
  ownerId!: string;

  @ApiProperty({ description: "Listing title" })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: "Listing description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Price amount" })
  @IsString()
  priceAmount!: string;

  @ApiPropertyOptional({ description: "Currency code (e.g., USD, EUR)" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({
    description: "Property type (e.g., apartment, house)",
  })
  @IsOptional()
  @IsString()
  propertyType?: string;
}
