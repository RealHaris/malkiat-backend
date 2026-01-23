import { IsString } from 'class-validator';

export class DeleteListingDto {
  @IsString()
  id!: string;

  @IsString()
  ownerId!: string;
}
