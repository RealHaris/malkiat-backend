import { IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class DeleteListingDto {
  @ApiProperty({ description: "Listing ID" })
  @IsString()
  id!: string;

  @ApiProperty({ description: "Owner user ID" })
  @IsString()
  ownerId!: string;
}
