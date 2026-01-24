import { IsIn, IsOptional, IsString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateListingDto {
  @ApiProperty({ description: "Listing ID" })
  @IsString()
  id!: string;

  @ApiProperty({ description: "Owner user ID" })
  @IsString()
  ownerId!: string;

  @ApiPropertyOptional({ description: "Listing title" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Listing description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Price amount" })
  @IsOptional()
  @IsString()
  priceAmount?: string;

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

  @ApiPropertyOptional({
    enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
    description: "Listing status",
  })
  @IsOptional()
  @IsIn(["DRAFT", "PUBLISHED", "ARCHIVED"])
  status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}
